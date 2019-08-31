import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class Menus extends Component {
  onCollectClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true, status: 'complete' }, (result) => {
      chrome.tabs.sendMessage(result[0].id, { action: 'show-collect' }, {}, (response) => {
        console.log(response)
        window.close()
      })
    })
  }

  render() {
    return (
      <ul>
        <li>
          <a onClick={() => this.onCollectClick()}>显示收藏</a>
        </li>
      </ul>
    )
  }
}

ReactDOM.render(
  <div>
    <Menus />
  </div>,
  document.querySelector('#root')
)
