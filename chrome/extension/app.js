import React from 'react'
import ReactDOM from 'react-dom'
import Root from '../../app/Root'

chrome.storage.local.get('state', (obj) => {
  ReactDOM.render(<Root />, document.querySelector('#root'))
})
