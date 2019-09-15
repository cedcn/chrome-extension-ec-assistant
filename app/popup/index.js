import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, Button } from 'antd'
import styles from './index.module.css'

let windowId = 0
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
    width: 1024,
    height: 650,
  }
  if (type === 'open') {
    options.url = `window.html?text=${params.selectionText}`
    chrome.windows.create(options, (win) => {
      windowId = win.id
    })
  }
}

class Popup extends Component {
  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFields((err, values) => {
      if (!err) {
        popWindow('open', { selectionText: values.keyword })
      }
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form

    return (
      <Form onSubmit={this.handleSubmit} className={styles.wrapper}>
        <h4>输入关键词或宝贝标题</h4>
        <Form.Item>
          {getFieldDecorator('keyword', {
            rules: [{ required: true, message: '请输入' }],
          })(<Input.TextArea className={styles.input} placeholder="不超过14个字符" />)}
        </Form.Item>

        <div className={styles.button_wrapper}>
          <Button className={styles.button} htmlType="submit" type="primary">
            -&gt; 挖词
          </Button>
        </div>
      </Form>
    )
  }
}

Popup.propTypes = {
  form: PropTypes.object.isRequired,
}

export default Form.create({ keyword: null })(Popup)
