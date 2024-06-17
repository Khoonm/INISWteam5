import re
import time
import requests
import pychrome
import platform
import subprocess
import configparser
import getYoutubeInfo
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def read_settings(file_path):
    config = configparser.ConfigParser()
    config.read(file_path, encoding='utf-8')

    chrome_exe_dir = config.get('DEFAULT', 'chrome_exe_dir')
    user_data_dir = config.get('DEFAULT', 'user_data_dir')
    profile_dir = config.get('DEFAULT', 'profile_dir')
    user_key = config.get('DEFAULT', 'user_key')
    
    return chrome_exe_dir, user_data_dir, profile_dir, user_key

def open_chrome_with_debugging(chrome_exe_dir, user_data_dir, profile_dir):
    # 크롬 브라우저를 서브프로세스로 실행(Mac)
    if platform.system() == 'Darwin':
        subprocess.Popen(["open", "-a", chrome_exe_dir, "--args", "--remote-debugging-port=9222",
                      f"--user-data-dir={user_data_dir}", f"--profile-directory={profile_dir}"])
    
    elif platform.system() == 'Windows':
    # 크롬 브라우저를 서브프로세스로 실행(Win)
        subprocess.Popen([chrome_exe_dir, "--remote-debugging-port=9222",
                      f"--user-data-dir={user_data_dir}", f"--profile-directory={profile_dir}"])

def setup_chrome_driver():
    # 크롬 옵션 설정
    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    
    # 크롬 드라이버 설정
    driver_service = Service(ChromeDriverManager().install())
    
    driver = webdriver.Chrome(service=driver_service, options=chrome_options)
    
    return driver

def find_center_element_in_full_page(driver):
    # 전체 페이지의 크기 가져오기
    page_width = driver.execute_script("return document.documentElement.scrollWidth")
    page_height = driver.execute_script("return document.documentElement.scrollHeight")

    # 페이지 중앙 좌표 계산
    center_x = page_width / 2
    center_y = page_height / 2

    # 스크롤을 페이지 중앙으로 이동
    driver.execute_script("window.scrollTo(arguments[0], arguments[1]);", center_x - driver.execute_script("return window.innerWidth") / 2, center_y - driver.execute_script("return window.innerHeight") / 2)

    # 잠시 대기 (스크롤 이동 후 페이지가 완전히 로드되기를 기다림)
    driver.implicitly_wait(2)

    # 중앙 좌표의 요소 찾기
    element = driver.execute_script("return document.elementFromPoint(arguments[0], arguments[1]);", driver.execute_script("return window.innerWidth") / 2, driver.execute_script("return window.innerHeight") / 2)
    
    return element


def find_significant_parent(driver, element, threshold=0.5):
    # 화면의 중요한 부분을 차지하는 부모 요소 찾기
    page_width = driver.execute_script("return document.documentElement.scrollWidth")
    page_height = driver.execute_script("return document.documentElement.scrollHeight")
    page_area = page_width * page_height
    body = driver.find_element(By.TAG_NAME, "body")

    while element and element != body:
        rect = element.rect
        elem_area = rect['width'] * rect['height']
        area_ratio = elem_area / page_area

        if area_ratio > threshold:
            return element

        element = element.find_element(By.XPATH, "..")  # 부모 요소로 이동

    return None

def get_current_tab_url(browser):
    # 모든 탭 가져오기
    tabs = browser.list_tab()

    # 포커싱된 탭 찾기
    focused_tab = None
    for tab in tabs:
        if tab.type == "page" and tab.active:  # 탭이 'page' 타입이고 활성화된 경우
            focused_tab = tab
            break

    if focused_tab:
        return focused_tab._kwargs['url']
    else:
        return None

def start():
    chrome_exe_dir, user_data_dir, profile_dir, user_key = read_settings('setting.ini')

    open_chrome_with_debugging(chrome_exe_dir, user_data_dir, profile_dir)
    driver = setup_chrome_driver()
    time.sleep(5)

    while True:
        browser = pychrome.Browser(url="http://127.0.0.1:9222")
        current_url = get_current_tab_url(browser)
        if current_url == 'chrome://newtab/':
            time.sleep(10)
            continue
        
        print(current_url)

        if ('https://www.youtube.com/watch?v=' in current_url) or ('https://www.youtube.com/shorts/' in current_url):
            url_data = getYoutubeInfo.get_youtube_info(current_url)

        else:
            driver.get(current_url)
            time.sleep(10)

            element = find_center_element_in_full_page(driver)

            url_data = find_significant_parent(driver, element).text

        '''now = int(datetime.now().timestamp())

        if url_data:
            add_data = {'Timestamp':now, 'URL':current_url, 'Text':url_data, 'FLG':0}
        else:
            add_data = {'Timestamp':now, 'URL':current_url, 'Text':'....', 'FLG':0}

        with open('data.txt', 'a', encoding='utf8') as file:
            file.write(str(json.dumps(add_data, ensure_ascii=False)) + "\n")'''

        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")

        url_data = url_data.replace('/n', '')
        url_data = (re.sub(r'[^a-zA-Z0-9가-힣\s]', '', url_data)).lower()

        if not url_data:
            url_data = '....'

        add_data = {
            "USER_KEY_CD": user_key,
            "GET_DATE_YMD": date_str,
            "GET_TIME_DT": time_str,
            "URL_STR": current_url,
            "DATA_STR": url_data,
            "TYPE_FLG": 0
        }

        try:
            response = requests.post('http://127.0.0.1:3000/crawledData', json=add_data)
            if response.status_code == 201:
                print("Data successfully posted to server.")
            else:
                print(f"Failed to post data to server: {response.status_code}")
        except Exception as e:
            print(f"Error while posting data to server: {e}")

        time.sleep(10)