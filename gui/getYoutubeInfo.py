from pytube import YouTube

# 비디오 아이디 가져오는 함수 정의 
def get_youtube_info(url):
    yt = YouTube(url)
    
    yt_title = yt.title

    try:
        yt.streams.first()
        yt_description = str(yt.description)
        if yt_description != None:
            return yt_title + ' ' + yt_description
        else:
            return yt_title
    except:
        return yt_title