import React from 'react'
import ReactDOM from 'react-dom'
import Root from '../../app/containers/Root'
import createStore from '../../app/store/configureStore'

chrome.storage.local.get('state', (obj) => {
  const { state } = obj
  const initialState = JSON.parse(state || '{}')
  const store = createStore(initialState)

  ReactDOM.render(<Root store={store} />, document.querySelector('#root'))
})
