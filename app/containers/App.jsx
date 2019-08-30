import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { map, flatten, forEach } from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import jsonpAdapter from 'axios-jsonp'
import ReactTable from 'react-table'
import * as TodoActions from '../actions/todos'
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

@connect(
  (state) => ({
    todos: state.todos,
  }),
  (dispatch) => ({
    actions: bindActionCreators(TodoActions, dispatch),
  })
)
class App extends Component {
  state = {
    searchResults: [],
  }

  componentDidMount() {
    const { keyword } = this.props
    axios
      .get(`https://1836000086198179.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/ec-assistant/npl/?text=${keyword}`)
      .then(async (response) => {
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
        const results = await Promise.all(
          map(newWrods, async (item) => {
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

        this.setState({ searchResults: flatten(results) })
      })
  }

  render() {
    const dataSource = map(this.state.searchResults, (item) => ({ keyword: item }))
    return (
      <div className={style.normal}>
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
