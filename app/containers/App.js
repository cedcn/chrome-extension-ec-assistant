/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Tabs, Alert, Icon, Tooltip } from 'antd'
import { map } from 'lodash'
import ProgressBar from 'react-progress-bar-plus'
import styles from './app.module.css'
import DataTable from './DataTable'
import { downloadXlsx } from '../utils'

const { TabPane } = Tabs

class App extends Component {
  constructor(props) {
    super(props)

    const { keyword } = props
    const panes = [{ keyword, key: '1' }]
    this.newTabIndex = 0
    this.state = {
      isNoLogin: false,
      percent: -1,
      activeKey: panes[0].key,
      panes,
    }
  }

  onChange = (activeKey) => {
    this.setState({ activeKey })
  }

  onEdit = (targetKey, action) => {
    this[action](targetKey)
  }

  setIsNoLogin = (bool) => {
    this.setState({ isNoLogin: bool })
  }

  add = () => {
    const { panes } = this.state
    const activeKey = `newTab${this.newTabIndex++}`
    panes.push({ title: 'New Tab', content: 'New Tab Pane', key: activeKey })
    this.setState({ panes, activeKey })
  }

  addPane = (keyword) => {
    const { panes } = this.state
    const activeKey = `newTab${this.newTabIndex++}`
    panes.push({ keyword, key: activeKey })

    this.setState({ panes, activeKey })
  }

  remove = (targetKey) => {
    let { activeKey } = this.state
    let lastIndex
    this.state.panes.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1
      }
    })
    const panes = this.state.panes.filter((pane) => pane.key !== targetKey)
    if (panes.length && activeKey === targetKey) {
      if (lastIndex >= 0) {
        activeKey = panes[lastIndex].key
      } else {
        activeKey = panes[0].key
      }
    }
    this.setState({ panes, activeKey })
  }

  setPercent = (percent) => {
    this.setState({ percent })
  }

  changeReferer = (details) => {
    let exists = false
    const tReferer = 'https://subway.simba.taobao.com/'
    const sendHeaders = details.requestHeaders

    if (details.initiator.match(/^chrome-extension/) && details.url.match(tReferer)) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < sendHeaders.length; ++i) {
        if (sendHeaders[i].name.toLowerCase() === 'referer') {
          exists = true
          sendHeaders[i].value = tReferer
          break
        }
      }

      if (!exists) {
        sendHeaders.push({ name: 'Referer', value: tReferer })
      }

      sendHeaders.push({ name: 'Content-Type', value: 'application/x-www-form-urlencoded; charset=UTF-8' })
      return { requestHeaders: sendHeaders }
    }
  }

  componentWillMount() {
    chrome.webRequest.onBeforeSendHeaders.removeListener(this.changeReferer)
  }

  componentDidMount() {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      this.changeReferer,
      { urls: ['https://*.taobao.com/*'], types: ['xmlhttprequest'] },
      ['blocking', 'requestHeaders', 'extraHeaders']
    )
  }

  render() {
    const { panes, isNoLogin } = this.state
    const operations = (
      <>
        <Tooltip placement="bottom" title="所有数据为近7天平均值">
          <Icon type="question-circle" />
        </Tooltip>
        <Button
          onClick={() => {
            downloadXlsx()
          }}
          className={styles.export_button}
          size="small"
        >
          导出Execl
        </Button>
      </>
    )

    return (
      <div className={styles.normal}>
        <ProgressBar percent={this.state.percent} spinner={false} />
        {isNoLogin && (
          <Alert
            className={styles.warning}
            message={
              <div>
                <span>登陆直通车，显示更多关键词信息。</span>
                <a href="https://subway.simba.taobao.com" target="_blank" rel="noopener noreferrer">
                  去登陆
                </a>
              </div>
            }
            type="warning"
            showIcon
            closable
          />
        )}
        <Tabs
          hideAdd
          onChange={this.onChange}
          activeKey={this.state.activeKey}
          type="editable-card"
          tabBarExtraContent={operations}
          onEdit={this.onEdit}
        >
          {map(panes, (pane) => (
            <TabPane tab={pane.keyword} key={pane.key} closable={panes.length > 1}>
              <DataTable
                keyword={pane.keyword}
                addPane={this.addPane}
                setPercent={this.setPercent}
                percent={this.state.percent}
                setIsNoLogin={this.setIsNoLogin}
              />
            </TabPane>
          ))}
        </Tabs>
      </div>
    )
  }
}

App.propTypes = {
  keyword: PropTypes.string.isRequired,
}

export default App
