import React, { Component } from 'react'
import queryString from 'query-string'
import App from './containers/App'
import './global.css'

const parsed = queryString.parse(document.location.search)
const keyword = parsed.text || ''

export default class Root extends Component {
  render() {
    return <App keyword={keyword} />
  }
}
