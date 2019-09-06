let windowId = 0
const CONTEXT_MENU_ID = 'context_menu'

function closeIfExist() {
  if (windowId > 0) {
    chrome.windows.remove(windowId)
    windowId = chrome.windows.WINDOW_ID_NONE
  }
}

function popWindow(type, params) {
  closeIfExist()
  const options = {
    type: 'popup',
    left: 100,
    top: 100,
    width: 800,
    height: 475,
  }
  if (type === 'open') {
    options.url = `window.html?text=${params.selectionText}`
    chrome.windows.create(options, (win) => {
      windowId = win.id
    })
  }
}

chrome.contextMenus.create({
  id: CONTEXT_MENU_ID,
  title: '挖掘关键词',
  contexts: ['selection'],
  documentUrlPatterns: ['http://*/*', 'https://*/*'],
})

chrome.contextMenus.onClicked.addListener((params) => {
  if (params.menuItemId === CONTEXT_MENU_ID) {
    popWindow('open', params)
  }
})
