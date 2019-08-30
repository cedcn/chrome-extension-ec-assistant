import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import queryString from 'query-string'
import App from './App'

const parsed = queryString.parse(document.location.search)
const keyword = parsed.text || ''

export default class Root extends Component {
  render() {
    const { store } = this.props
    return (
      <Provider store={store}>
        <App keyword={keyword} />
      </Provider>
    )
  }
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
}
