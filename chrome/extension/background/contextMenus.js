let windowId = 0
const CONTEXT_MENU_ID = 'example_context_menu'

function closeIfExist() {
  if (windowId > 0) {
    chrome.windows.remove(windowId)
    windowId = chrome.windows.WINDOW_ID_NONE
  }
}

function popWindow(type) {
  closeIfExist()
  const options = {
    type: 'popup',
    left: 100,
    top: 100,
    width: 800,
    height: 475,
  }
  if (type === 'open') {
    options.url = 'window.html'
    chrome.windows.create(options, (win) => {
      windowId = win.id
    })
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(sender.tab ? `来自内容脚本：${sender.tab.url}` : '来自扩展程序')
  if (request.greeting === '您好') sendResponse({ farewell: '再见' })
})

chrome.contextMenus.create({
  id: CONTEXT_MENU_ID,
  title: '挖词',
  contexts: ['selection'],
  documentUrlPatterns: ['https://github.com/*'],
})

chrome.contextMenus.onClicked.addListener((event) => {
  if (event.menuItemId === CONTEXT_MENU_ID) {
    popWindow('open')
  }
})
