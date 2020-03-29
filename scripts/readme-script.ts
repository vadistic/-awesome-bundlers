/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path'
import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { list } from '../data/bundler-list.json'

dotenv.config()

const DATA_PATH = './data/res.json'
const README_PREFACE_PATH = './data/README_PREFACE.md'
const README_POSTFACE_PATH = './data/README_POSTFACE.md'
const TOKEN = process.env.TOKEN

const abs = (rel: string) => path.join(process.cwd(), rel)
type Row = Octokit.ReposGetResponse & typeof list[number]
type DataFile = {
  data: Row[]
  timestamp: string
}

const printJsonTable = <T, H>(
  headers: { [K in keyof H]: string },
  render: { [K in keyof H]: (row: T) => string },
  rows: T[],
) => {
  let res = ''

  res += '| ' + Object.values(headers).join(' | ') + ' |\n'
  res += '|' + ' --- |'.repeat(Object.values(headers).length) + '\n'

  rows.forEach((row) => {
    res += '| '

    Object.keys(headers).forEach((key) => {
      const renderFn = render[key as keyof H]
      res += ' '
      res += renderFn(row)
      res += ' |'
    })

    res += '\n'
  })

  return res
}

const fetchData = async () => {
  const octokit = new Octokit({ auth: TOKEN })

  if (!TOKEN) {
    throw Error('TOKEN missing')
  }

  const rowsP = list.map(async (item) => {
    const [owner, repo] = item.full_name.split('/')

    const { data } = await octokit.repos.get({ owner, repo })

    return {
      ...item,
      ...data,
    }
  })

  const data = await Promise.all(rowsP)

  return {
    timestamp: new Date().toJSON(),
    data,
  }
}

const main = async () => {
  const hasCachedData = fs.existsSync(abs(DATA_PATH))

  const dataFile: DataFile = hasCachedData
    ? fs.readJSONSync(abs(DATA_PATH), { encoding: 'utf8' })
    : await fetchData()

  if (!hasCachedData) {
    await fs.writeJSON(abs(DATA_PATH), dataFile, { spaces: 2, encoding: 'utf8' })
  }

  const { data, timestamp } = dataFile

  const sortedData = data.sort((a, b) => (a.stargazers_count < b.stargazers_count ? 1 : -1))

  const table = printJsonTable(
    {
      name: 'Name',
      stars: 'Stars',
      forks: 'Forks',
      issues: 'Issues',
      watchers: 'Watchers',
      sample: 'Sample',
      description: 'Description',
      badges: 'Badges',
    },
    {
      name: ({ name, html_url, homepage }) => {
        let res = `**${name}**`

        res += ' ('
        if (html_url) res += `[*github*](${html_url})`
        if (html_url && homepage) res += '&'
        if (homepage) res += `[*web*](${homepage})`
        res += ')'

        return res
      },
      stars: (p) => `🌟[${p.stargazers_count}](${p.html_url}/stargazers)`,
      forks: (p) => `🍴[${p.forks_count}](${p.html_url}/network/members)`,
      issues: (p) => `🚨[${p.open_issues_count}](${p.html_url}/issues)`,
      watchers: (p) => `👀[${p.subscribers_count}](${p.html_url}/watchers)`,
      sample: (p) =>
        p.sample_name ? `[samples/${p.sample_name}](./samples/${p.sample_name})` : '*TODO*',
      description: ({ description }) => '*' + description + '*',
      badges: (p) => {
        let res = ''

        res +=
          `[![NPM version]` +
          `(https://img.shields.io/npm/v/${p.npm_name}.svg)]` +
          `('https://www.npmjs.com/${p.npm_name}')`

        res +=
          `[![NPM downloads]` +
          `(https://img.shields.io/npm/dw/${p.npm_name}.svg)]` +
          `('https://www.npmjs.com/${p.npm_name}')`

        res +=
          `[![NPM Dependents]` +
          `(https://img.shields.io/librariesio/dependents/npm/${p.npm_name})]` +
          `('https://www.npmjs.com/${p.npm_name}')`

        res +=
          `[![NPM Repos]` +
          `(https://img.shields.io/librariesio/dependent-repos/npm/${p.npm_name})]` +
          `('https://www.npmjs.com/${p.npm_name}')`

        res +=
          `[![GitHub PRs]` +
          `(https://img.shields.io/github/issues-pr/${p.full_name}?style=social)]` +
          `('${p.html_url}') `

        res +=
          `[![GitHub commits]` +
          `(https://img.shields.io/github/commit-activity/m/${p.full_name}?style=social)]` +
          `('${p.html_url}') `

        return res
      },
    },
    sortedData,
  )

  const preface = await fs.readFile(abs(README_PREFACE_PATH), 'utf8')
  const when = `*Dataset generated: ${new Date(timestamp).toDateString()}*`
  const postface = await fs.readFile(abs(README_POSTFACE_PATH), 'utf8')

  const readme = preface + '\n\n' + when + '\n\n' + table + '\n\n' + postface

  await fs.writeFile(abs('README.md'), readme)
}

main()
