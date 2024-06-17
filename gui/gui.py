import time
import bodyGet
import requests
import threading
import configparser
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime

# 실행 함수
def start():
    bodyGet.start()

# 타이머 쓰레드 실행 함수
def start_timer_thread():
    t = threading.Thread(target=start)
    t.daemon = True  # 메인 쓰레드가 종료될 때 함께 종료됨
    t.start()

# 타이머 앱 클래스 정의
class TimerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Timer")
        self.root.geometry("370x120")
        self.root.configure(bg='white')

        # 메뉴 생성
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        # 'Timer' 메뉴
        timer_menu = tk.Menu(menubar, tearoff=0)
        timer_menu.add_command(label="Option", command=self.show_option)
        timer_menu.add_command(label="Quit", command=self.root.quit)
        menubar.add_cascade(label="Timer", menu=timer_menu)

        self.timer_running = False
        self.timer_reset = True
        self.time_start = 0
        self.time_elapsed = 0
        self.timer_display = tk.StringVar()
        self.timer_display.set("00:00:00")
        
        # 스타일 설정
        self.style = ttk.Style()
        self.style.configure("TFrame", background="white")
        self.style.configure("TLabel", background="white", font=('Arial', 24))
        self.style.configure("TButton", font=('Arial', 10))
        self.style.configure("Green.TButton", background="green")
        self.style.configure("Orange.TButton", background="orange")
        self.style.configure("Red.TButton", background="red")
        
        self.create_widgets()

    # 위젯 생성
    def create_widgets(self):
        self.label_timer = ttk.Label(self.root, textvariable=self.timer_display, style="TLabel")
        self.label_timer.pack(pady=20)

        self.frame_buttons = ttk.Frame(self.root, padding=5, style="TFrame")
        self.frame_buttons.pack(fill=tk.X, padx=15)

        self.button_start = ttk.Button(self.frame_buttons, text="Start", command=self.start_timer, width=10, style="Green.TButton")
        self.button_start.pack(side=tk.LEFT, padx=5)

        self.button_pause = ttk.Button(self.frame_buttons, text="Pause", command=self.pause_timer, width=10, style="Orange.TButton")
        self.button_pause.pack(side=tk.LEFT, padx=5)

        self.button_stop = ttk.Button(self.frame_buttons, text="Stop", command=self.stop_timer, width=10, style="Red.TButton")
        self.button_stop.pack(side=tk.LEFT, padx=5)
    
    # 클립보드에 링크 복사
    def copy_to_clipboard(self, event=None):
        self.popup.clipboard_clear()
        self.popup.clipboard_append('chrome://version/')
        self.popup.update()
        tk.messagebox.showinfo("Copied", "Link copied to clipboard!")

    # 옵션 창 표시
    def show_option(self):
        self.popup = tk.Toplevel(self.root)
        self.popup.title("Input")

        tk.Label(self.popup, text="Please click the link below and paste it into Chrome").grid(row=0, columnspan=2, pady=5)

        self.link_text = tk.Text(self.popup, height=1, width=20)
        self.link_text.insert('1.0', 'chrome://version/')
        self.link_text.tag_add("link", "1.0", "end")
        self.link_text.tag_config("link", foreground="blue", underline=True)
        self.link_text.tag_bind("link", "<Button-1>", self.copy_to_clipboard)
        self.link_text.grid(row=1, columnspan=2, pady=5)
        self.link_text.configure(cursor="hand2", background=self.popup.cget('background'), borderwidth=0)

        tk.Label(self.popup, text="Executable Path").grid(row=2, column=0, padx=5, pady=5)
        self.chrome_executable_path = tk.Entry(self.popup, width=50)
        self.chrome_executable_path.grid(row=2, column=1, pady=5)

        tk.Label(self.popup, text="Profile Path").grid(row=3, column=0, pady=5)
        self.user_data_dir = tk.Entry(self.popup, width=50)
        self.user_data_dir.grid(row=3, column=1, pady=5)

        tk.Label(self.popup, text="Profile Name").grid(row=4, column=0, pady=5)
        self.profile_directory = tk.Entry(self.popup, width=50)
        self.profile_directory.grid(row=4, column=1, pady=5)

        tk.Label(self.popup, text="User Key").grid(row=5, column=0, pady=5)
        self.user_key = tk.Entry(self.popup, width=50)
        self.user_key.grid(row=5, column=1, pady=5)

        submit_button = tk.Button(self.popup, text="Submit", command=self.submit)
        submit_button.grid(row=6, columnspan=2, pady=10)

    # 옵션 값 제출
    def submit(self):
        config = configparser.ConfigParser()
        config.read('./setting.ini', encoding='utf-8')

        chrome_exe_dir = self.chrome_executable_path.get()
        user_data_dir = self.user_data_dir.get()
        profile_dir = self.profile_directory.get()
        user_key = self.user_key.get()

        config['DEFAULT'] = {
            'chrome_exe_dir': chrome_exe_dir.replace('\\','\\\\'),
            'user_data_dir': user_data_dir.replace('\\','\\\\'),
            'profile_dir': profile_dir.replace('\\','\\\\'),
            'user_key': user_key
        }

        with open('./setting.ini', 'w', encoding='utf-8') as configfile:
            config.write(configfile)
        
        if chrome_exe_dir and user_data_dir and profile_dir:
            messagebox.showinfo("Input Received", f"Chrome Executable Path: {chrome_exe_dir}\n"
                                                f"User Data Directory: {user_data_dir}\n"
                                                f"Profile Directory: {profile_dir}\n"
                                                f"User Key: {user_key}")
            self.popup.destroy()
        else:
            messagebox.showwarning("Input Incomplete", "All fields must be filled!")

    # 타이머 업데이트
    def update_timer(self):
        if self.timer_running:
            self.time_elapsed = time.time() - self.time_start
            self.display_time()
            self.root.after(1000, self.update_timer)

    # 시간을 표시
    def display_time(self):
        hours, rem = divmod(self.time_elapsed, 3600)
        minutes, seconds = divmod(rem, 60)
        self.timer_display.set(f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}")

    # 타이머 시작
    def start_timer(self):
        if not self.timer_running or self.timer_reset:
            config = configparser.ConfigParser()
            config.read('./setting.ini', encoding='utf-8')
            user_key = config.get('DEFAULT', 'user_key')
            now = datetime.now()
            date_str = time.strftime("%Y-%m-%d")
            time_str = now.strftime("%H:%M")

            try:
                workdata = {
                    "USER_KEY_CD": user_key,
                    "DATE_YMD": date_str,
                    "TIME_DT": time_str,
                    "FIN_FLG": 0
                }
                requests.post('http://127.0.0.1:3000/work', json=workdata)
            except Exception as e:
                print(f"Error while posting data to server: {e}")
            self.timer_reset = False
            self.timer_running = True
            self.time_start = time.time() - self.time_elapsed
            self.update_timer()
            start_timer_thread()  # 멀티 쓰레드로 실행

    # 타이머 일시정지
    def pause_timer(self):
        self.timer_running = False

    # 타이머 정지
    def stop_timer(self):
        self.timer_running = False
        self.timer_reset = True
        self.time_elapsed = 0
        self.timer_display.set("00:00:00")
        
        # 필요한 데이터를 수집
        config = configparser.ConfigParser()
        config.read('./setting.ini', encoding='utf-8')

        user_key = config.get('DEFAULT', 'user_key')

        date_str = time.strftime("%Y-%m-%d")  # 현재 날짜
        time_str = '.'
        current_url = '.'
        url_data = '.'
        
        add_data = {
            "USER_KEY_CD": user_key,
            "GET_DATE_YMD": date_str,
            "GET_TIME_DT": time_str,
            "URL_STR": current_url,
            "DATA_STR": url_data,
            "TYPE_FLG": 1
        }

        print(add_data)

        # 서버로 POST 요청 보내기
        try:
            requests.post('http://127.0.0.1:3000/crawledData', json=add_data)
        except Exception as e:
            print(f"Error while posting data to server: {e}")

        self.root.quit()

if __name__ == "__main__":
    root = tk.Tk()
    app = TimerApp(root)
    root.mainloop()