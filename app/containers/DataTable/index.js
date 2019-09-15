/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { Table } from 'antd'
import moment from 'moment'
import numeral from 'numeral'
import queue from 'queue'
import { map, forEach, chunk, round, reduce, isEmpty, isUndefined } from 'lodash'
import styles from './index.module.css'
import { participle, digwordsFromDropDown } from '../../utils'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      wordGroup: [],
      isLoading: false,
    }

    this.q = queue({ results: [], concurrency: 1 })
  }

  componentDidMount() {
    this.onInvoke()
  }

  componentWillUnmount() {
    this.q.end()
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

      const endDate = moment().format('YYYY-MM-DD')
      const startDate = moment()
        .subtract(7, 'days')
        .format('YYYY-MM-DD')

      forEach(wordGroupChunks, (wordChunk) => {
        this.q.push(() => {
          const wordChunkRequests = map(wordChunk, async (word) => {
            const result = await this.getCategories({ axiosInstance, token, keyword: word.keyword, startDate, endDate })

            return { ...word, ...result }
          })

          return Promise.all(wordChunkRequests)
        })
      })

      const jobCount = this.q.length
      this.q.start()

      this.q.on('success', (result) => {
        const progress = (jobCount - this.q.length) / jobCount
        const percent = progress >= 1 ? -1 : progress * 100
        this.props.setPercent(percent)
        this.setState((prevState) => ({ isLoading: false, wordGroup: [...prevState.wordGroup, ...result] }))
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

  getCategories = async ({ axiosInstance, token, keyword, startDate, endDate }) => {
    const response = await axiosInstance({
      url: `/openapi/param2/1/gateway.subway/traffic/word/category$?word=${keyword}&token=${token}`,
      method: 'POST',
    })

    const cateList = response.data.result.cateList
    let result = []
    if (!isEmpty(cateList)) {
      const report = await this.getReport({
        axiosInstance,
        token,
        keyword,
        cateId: cateList[0].cateId,
        startDate,
        endDate,
      })
      if (report && report.length > 0) {
        result = { category: cateList[0].cateName, ...this.calculateReportArg(report) }
      } else {
        result = { category: cateList[0].cateName }
      }
    }

    return result
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
      avgPrice: round(value.avgPrice / count, 2),
      clickIndex: numeral(round(value.clickIndex / count)).format('0,0'),
      competition: round(value.competition / count),
      ctr: round((value.ctr / count) * 100, 2),
      cvr: round((value.cvr / count) * 100, 2),
      impressionIndex: numeral(round(value.impressionIndex / count)).format('0,0'),
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
    const { addPane, keyword } = this.props
    const columns = [
      {
        title: '关键词',
        dataIndex: 'keyword',
        render: (text) => <a onClick={() => addPane(text)}>{text}</a>,
        width: 150,
      },
      {
        title: '类目',
        dataIndex: 'category',
        render: (text) => <span className={styles.category}>{text}</span>,
        width: 150,
      },
      {
        title: '展现指数',
        dataIndex: 'impressionIndex', // 展现指数
        width: 100,
      },
      {
        title: '点击指数',
        dataIndex: 'clickIndex', // 展现指数
        width: 100,
      },
      {
        title: '点击率',
        dataIndex: 'ctr', // 点击率
        render: (text) => (isUndefined(text) ? '-' : `${text}%`),
        width: 100,
      },
      {
        title: '转化率',
        dataIndex: 'cvr', // 转化率
        render: (text) => (isUndefined(text) ? '-' : `${text}%`),
        width: 100,
      },
      {
        title: '市场均价',
        dataIndex: 'avgPrice', // 市场均价
        width: 100,
      },
      {
        title: '竞争度',
        dataIndex: 'competition', // 竞争度
        width: 100,
      },
      {
        title: '详细',
        key: 'action',
        width: 80,
        render: (text, record) => (
          <span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://subway.simba.taobao.com/#!/tool/traffic-analysis/index?word=${record.keyword}`}
            >
              &gt;&gt;
            </a>
          </span>
        ),
      },
    ]

    const { wordGroup, isLoading } = this.state
    const dataSource = map(wordGroup, (word, index) => ({ key: index, ...word }))

    return (
      <Table pagination={false} loading={isLoading} columns={columns} dataSource={dataSource} scroll={{ x: true }} />
    )
  }
}

App.propTypes = {
  keyword: PropTypes.string.isRequired,
  addPane: PropTypes.func.isRequired,
  setPercent: PropTypes.func.isRequired,
}

export default App
