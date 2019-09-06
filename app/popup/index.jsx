import React, { Component } from 'react'
import { Input, Button } from 'antd'

class Popup extends Component {
  onCollectClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true, status: 'complete' }, (result) => {
      chrome.tabs.sendMessage(result[0].id, { action: 'show-collect' }, {}, (response) => {
        window.close()
      })
    })
  }

  render() {
    return (
      <div>
        <Input />
        <Button>挖词</Button>
      </div>
    )
  }
}

export default Popup
