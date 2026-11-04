# WORKLOG

- Created `hello-agent/index.html` with the large headline "My agent works" and a responsive one-direction layout -> `Get-ChildItem hello-agent` -> `index.html  1755`
- Rendered the page at 1440x900 -> `chrome --headless=new --window-size=1440,900 --screenshot=hello-1440.png` -> `34415 bytes written to hello-1440.png`; inspected the image, headline fits on one line with margins
- Rendered the page at a true 375x812 viewport in an iframe -> `chrome --headless=new --dump-dom verify-375.html` -> `innerWidth=375 scrollWidth=375 bodyScrollWidth=375 fontSize=52px h1Width=327.0 h1Height=106.1 h1Lines=2`
- Opened the page in Chrome -> `Start-Process chrome.exe 'file:///C:/Users/Dasari/Downloads/fwai-starter%20(1)/hello-agent/index.html'` -> window title `My agent works - Google Chrome`
