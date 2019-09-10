/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { message, Spin, Table } from 'antd'
import queue from 'queue'
import { map, flatten, forEach, uniq, chunk, reduce, get } from 'lodash'
import styles from './app.module.css'
import { participle, digwordsFromDropDown, downloadXlsx } from '../utils'

const columns = [
  {
    title: '关键词',
    dataIndex: 'keyword',
  },
  {
    title: '展现量',
    dataIndex: 'impression', // 展现指数
  },
  {
    title: '点击指数',
    dataIndex: 'click', // 展现指数
  },
  {
    title: '点击率',
    dataIndex: 'ctr', // 点击率
  },
  {
    title: '转化率',
    dataIndex: 'cvr', // 转化率
  },
  {
    title: '市场均价',
    dataIndex: 'avgPrice', // 市场均价
  },
  {
    title: '竞争度',
    dataIndex: 'competition', // 竞争度
  },
  {
    title: '订单转化成本',
    dataIndex: 'cost', // 成本
  },
]

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      wordGroup: [],
      isLoading: false,
    }
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

    // this.onInvoke()
  }

  onInvoke() {
    this.setState({ isLoading: true, wordGroup: [] })
    chrome.cookies.getAll({ url: 'https://subway.simba.taobao.com/' }, async (cookie) => {
      let wordGroup = []
      wordGroup = await this.participle()
      wordGroup = await digwordsFromDropDown(wordGroup)

      const axiosInstance = axios.create({
        baseURL: 'https://subway.simba.taobao.com',
        headers: {
          Cookie: map(cookie, (item) => `${item.name}=${item.value}`).join(';'),
        },
      })

      const token = await this.getToken({ axiosInstance })
      const wordGroupChunks = chunk(wordGroup, 10)

      const q = queue({ results: [], concurrency: 10 })
      forEach(wordGroupChunks, (wordChunk) => {
        q.push(() => {
          const wordChunkRequests = map(wordChunk, async (word) => {
            const cateList = await this.getCategories({ axiosInstance, token, keyword: word.keyword })
            if (!cateList || cateList.length <= 0) {
              return word
            }

            return { ...word, categories: cateList }
          })

          return Promise.all(wordChunkRequests)
        })
      })
      q.start(() => {
        this.setState({ isLoading: false })
      })
      q.on('success', (result) => {
        this.setState((prevState) => ({ wordGroup: [...prevState.wordGroup, ...result] }))
      })
    })
  }

  getToken = async ({ axiosInstance }) => {
    const response = await axiosInstance({
      url: '/bpenv/getLoginUserInfo.htm',
      method: 'POST',
    })

    return response.data.result.token
  }

  getCategories = async ({ axiosInstance, token, keyword }) => {
    const response = await axiosInstance({
      url: `/openapi/param2/1/gateway.subway/traffic/word/category$?word=${keyword}&token=${token}`,
      method: 'POST',
    })

    const cateList = response.data.result.cateList

    const results = await Promise.all(
      map(cateList, async (cateItem) => {
        const report = await this.getReport({
          axiosInstance,
          token,
          keyword,
          cateId: cateItem.cateId,
          startDate: '2019-08-07',
          endDate: '2019-09-05',
        })
        if (report && report.length > 0) {
          return { category: cateItem, report: this.calculateReportArg(report) }
        }

        return { category: cateItem }
      })
    )

    return results
  }

  calculateReportArg = (report) => {
    const value = reduce(
      report,
      (acc, current) => {
        acc.avgPrice += Number(current.avgPrice)
        acc.clickIndex += Number(current.clickIndex)
        acc.competition += Number(current.competition)
        acc.ctr += Number(current.ctr)
        acc.cvr += Number(current.cvr)
        acc.impressionIndex += Number(current.impressionIndex)
        return acc
      },
      { avgPrice: 0, clickIndex: 0, competition: 0, ctr: 0, cvr: 0, impressionIndex: 0 }
    )
    const count = report.length
    return {
      avgPrice: value.avgPrice / count,
      clickIndex: value.clickIndex / count,
      competition: value.competition / count,
      ctr: value.ctr / count,
      cvr: value.cvr / count,
      impressionIndex: value.impressionIndex / count,
    }
  }

  getReport = async ({ axiosInstance, token, keyword, cateId, startDate, endDate }) => {
    const response = await axiosInstance({
      url: `/openapi/param2/1/gateway.subway/traffic/report/word/category$?word=${keyword}&token=${token}&cateId=${cateId}&sla=json&startDate=${startDate}&endDate=${endDate}`,
      method: 'POST',
    })
    return response.data.result
  }

  participle = async () => {
    const words = await participle(this.props.keyword)
    return [{ keyword: this.props.keyword }, ...words]
  }

  digwordsFromSubway = async ({ axiosInstance, token, word, cateId }) => {
    const relatedWords = await axiosInstance({
      url: `/openapi/param2/1/gateway.subway/traffic/related/word$?word=${word}&token=${token}&cateId=${cateId}`,
      method: 'POST',
    })
    const d = [...map(relatedWords.data.result, (item) => item.normalWord)]
    return d
  }

  render() {
    const { wordGroup } = this.state
    return (
      <div className={styles.normal}>
        <a
          onClick={() => {
            this.onInvoke()
          }}
        >
          sdsd
        </a>
        <a
          onClick={() => {
            downloadXlsx()
          }}
        >
          导出Execl
        </a>
        <Spin spinning={this.state.isLoading} />
        <Table pagination={false} columns={columns} dataSource={wordGroup} />
      </div>
    )
  }
}

App.propTypes = {
  keyword: PropTypes.string.isRequired,
}

export default App
