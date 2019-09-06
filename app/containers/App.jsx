import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { map, flatten, forEach, uniq } from 'lodash'
import jsonpAdapter from 'axios-jsonp'
import ReactTable from 'react-table'
import style from './app.module.css'
import './global.css'

const columns = [
  {
    Header: 'Keyword',
    accessor: 'keyword',
  },
  {
    Header: 'other',
    accessor: 'other',
  },
]

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      searchResults: [],
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

    this.onInvoke()
  }

  onInvoke() {
    chrome.cookies.getAll({ url: 'https://subway.simba.taobao.com/' }, async (cookie) => {
      const words = await this.partSentance()

      const axiosInstance = axios.create({
        baseURL: 'https://subway.simba.taobao.com',
        headers: {
          Cookie: map(cookie, (item) => `${item.name}=${item.value}`).join(';'),
        },
      })

      const token = await this.getToken({ axiosInstance })
      const recommentWords = await Promise.all(
        map(words, async (word) => {
          //
          const cateList = await this.getCategories({ axiosInstance, token, word })
          if (!cateList || cateList.length <= 0) {
            return []
          }
          const response = await this.digwordsFromSubway({ axiosInstance, token, word, cateId: cateList[0].cateId })
          return response
        })
      )

      this.setState({ searchResults: uniq([...words, ...flatten(recommentWords)]) })
    })
  }

  getToken = async ({ axiosInstance }) => {
    const response = await axiosInstance({
      url: '/bpenv/getLoginUserInfo.htm',
      method: 'POST',
    })

    return response.data.result.token
  }

  getCategories = async ({ axiosInstance, token, word }) => {
    const response = await axiosInstance({
      url: `/openapi/param2/1/gateway.subway/traffic/word/category$?word=${word}&token=${token}`,
      method: 'POST',
    })

    return response.data.result.cateList
  }

  partSentance = async () => {
    const { keyword } = this.props
    const response = await axios.get(
      `https://1836000086198179.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/ec-assistant/npl/?text=${keyword}`
    )

    const regroup = map(response.data, (item) => {
      const arr = []
      forEach(response.data, (child) => {
        if (item !== child) {
          arr.push(item + child)
        }
      })
      return arr
    })
    const newWrods = [...response.data, ...flatten(regroup)]
    const dropDownResults = await this.digwordsFromDropDown(newWrods)
    return flatten(dropDownResults)
  }

  digwordsFromDropDown = async (words) => {
    const results = await Promise.all(
      map(words, async (item) => {
        let json = []
        try {
          const taobaoRes = await axios({
            url: `https://suggest.taobao.com/sug?code=utf-8&q=${item}&_ksTS=1553703225083_374&k=1&area=c2c&bucketid=2`,
            adapter: jsonpAdapter,
          })

          if (taobaoRes.status === 200) {
            json = taobaoRes.data.result
            json = [item, ...map(json, (r) => r[0])]
          }
        } catch (error) {
          console.log(error)
        }

        return json
      })
    )

    return results
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
    const dataSource = map(this.state.searchResults, (item) => ({ keyword: item }))
    return (
      <div className={style.normal}>
        <a
          onClick={() => {
            this.onInvoke()
          }}
        >
          sdsd
        </a>
        <ReactTable
          data={dataSource}
          columns={columns}
          pageSize={dataSource.length}
          resizable={false}
          sortable={false}
          showPageJump={false}
          showPagination={false}
          showPaginationBottom={false}
          showPageSizeOptions={false}
        />
      </div>
    )
  }
}

App.propTypes = {
  keyword: PropTypes.string.isRequired,
}

export default App
