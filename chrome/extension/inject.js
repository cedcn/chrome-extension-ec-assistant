/* eslint-disable react/no-access-state-in-setstate */
import React, { Component } from 'react'
import { render } from 'react-dom'

class InjectApp extends Component {
  constructor(props) {
    super(props)
    this.state = { isVisible: false }
  }

  buttonOnClick = () => {
    this.setState({ isVisible: !this.state.isVisible })
  }

  render() {
    return (
      <div>
        <button type="button" onClick={this.buttonOnClick}>
          Open TodoApp
        </button>
      </div>
    )
  }
}

window.addEventListener('load', () => {
  const injectDOM = document.createElement('div')
  injectDOM.className = 'inject-react-example'
  injectDOM.style.textAlign = 'center'
  document.body.appendChild(injectDOM)
  render(<InjectApp />, injectDOM)
})
