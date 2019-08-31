/* eslint-disable react/no-access-state-in-setstate */
import React, { Component } from 'react'
import { render } from 'react-dom'
import nanoid from 'nanoid'
import Dock from 'react-dock'

class InjectApp extends Component {
  constructor(props) {
    super(props)
    this.state = { isVisible: false }
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'show-collect') {
        this.setState({ isVisible: true })
      }

      if (request.action === 'hide-collect') {
        this.setState({ isVisible: false })
      }
      sendResponse('accepted!')
    })
  }

  buttonOnClick = () => {
    this.setState({ isVisible: !this.state.isVisible })
  }

  render() {
    return (
      <div>
        <Dock
          zIndex={1000000001}
          position="right"
          fluid
          dimMode="opaque"
          defaultSize={0.4}
          isVisible={this.state.isVisible}
          onVisibleChange={(isVisible) => {
            this.setState({ isVisible })
          }}
        >
          <a onClick={this.buttonOnClick}>显示收藏</a>
        </Dock>
      </div>
    )
  }
}

window.addEventListener('load', () => {
  const injectDOM = document.createElement('div')
  injectDOM.className = `ec-assistant-${nanoid(4)}`
  injectDOM.style.textAlign = 'center'
  document.body.appendChild(injectDOM)
  render(<InjectApp />, injectDOM)
})
