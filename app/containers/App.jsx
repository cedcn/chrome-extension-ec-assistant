import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as TodoActions from '../actions/todos'
import style from './App.css'

@connect(
  (state) => ({
    todos: state.todos,
  }),
  (dispatch) => ({
    actions: bindActionCreators(TodoActions, dispatch),
  })
)
class App extends Component {
  onClick = () => {
    chrome.runtime.sendMessage({ greeting: '您好' }, function(response) {
      console.log('response', response)
    })
  }

  render() {
    return (
      <div className={style.normal}>
        Demo
        <a onClick={this.onClick} href="javascript:;">
          xxxx
        </a>
      </div>
    )
  }
}

App.propTypes = {
  todos: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
}

export default App
