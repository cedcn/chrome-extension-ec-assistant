import axios from 'axios'
import jsonpAdapter from 'axios-jsonp'
import XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { message } from 'antd'
import { map, flatten, forEach, isEmpty, find, get, replace } from 'lodash'

export const participle = async (keyword) => {
  let response
  try {
    response = await axios.get(
      `https://1836000086198179.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/ec-assistant/npl/?text=${keyword}`
    )
  } catch (error) {
    message.error('网络错误')
  }

  let wordGroup = map(response.data, (item) => ({ keyword: item }))

  const regroup = map(response.data, (item) => {
    const arr = []
    forEach(response.data, (child) => {
      if (item !== child) {
        arr.push({ keyword: item + child })
      }
    })
    return arr
  })

  wordGroup = [...wordGroup, ...flatten(regroup)]
  return wordGroup
}

export const extractWords = (wordGroup) => map(wordGroup, (item) => item.keyword)

export const digwordsFromDropDown = async (wordGroup) => {
  const results = await Promise.all(
    map(wordGroup, async (item) => {
      let group = []
      try {
        const taobaoRes = await axios({
          url: `https://suggest.taobao.com/sug?code=utf-8&q=${item.keyword}&_ksTS=1553703225083_374&k=1&area=c2c&bucketid=2`,
          adapter: jsonpAdapter,
        })

        if (taobaoRes.status === 200) {
          const { result, magic } = taobaoRes.data

          if (!isEmpty(result)) {
            const dropWords = map(result, (r, index) => {
              const porperty = find(magic, (m) => m.index === index.toString())
              const keyword = r[0].replace(/<[^>]+>/g, '')

              if (get(porperty, 'data')) {
                return { keyword, porperties: get(porperty, 'data') }
              }
              return { keyword }
            })
            group = [item, ...dropWords]
          } else {
            group = [item]
          }
        }
      } catch (error) {
        message.error('网络错误')
      }

      return group
    })
  )

  return flatten(results)
}

export const getCategories = async ({ axiosInstance, token, keyword }) => {
  const response = await axiosInstance({
    url: `/openapi/param2/1/gateway.subway/traffic/word/category$?word=${keyword}&token=${token}`,
    method: 'POST',
  })

  return response.data.result.cateList
}

export const s2ab = (s) => {
  if (typeof ArrayBuffer !== 'undefined') {
    const buf = new ArrayBuffer(s.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff
    return buf
  }

  const buf = new Array(s.length)
  for (let i = 0; i !== s.length; ++i) buf[i] = s.charCodeAt(i) & 0xff
  return buf
}

export const downloadXlsx = (fileName, tableSelector) => {
  const wb = XLSX.utils.table_to_book(document.body.querySelector(tableSelector || 'table'), {
    sheet: 'Sheet JS',
  })
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    bookSST: true,
    type: 'binary',
  })
  const fname = `${fileName || '关键词'}.xlsx`
  try {
    saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), fname)
  } catch (e) {
    console.log(e, wbout)
  }
}
