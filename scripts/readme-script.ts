/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path'
import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { list } from './bundler-list.json'

dotenv.config()

const DATA_PATH = './data.json'
const README_PREFACE_PATH = './README_PREFACE.md'
const README_POSTFACE_PATH = './README_POSTFACE.md'
const TOKEN = process.env.TOKEN

const abs = (rel: string) => path.join(process.cwd(), rel)

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

  return Promise.all(rowsP)
}

type Row = Octokit.ReposGetResponse & typeof list[number]

const main = async () => {
  const hasCachedData = fs.existsSync(abs(DATA_PATH))

  const dataFile: { data: Row[] } = hasCachedData
    ? fs.readJSONSync(abs(DATA_PATH), { encoding: 'utf8' })
    : { data: await fetchData() }

  if (!hasCachedData) {
    await fs.writeJSON(abs(DATA_PATH), dataFile, { spaces: 2, encoding: 'utf8' })
  }

  const { data } = dataFile

  const table = printJsonTable(
    {
      name: 'Name',
      github: 'Stars',
      npm: 'Open Issues',
      sample: 'Sample',
      description: 'Description',
    },
    {
      name: ({ name, html_url, homepage }) => {
        let res = `**${name}**`

        res += ' ('
        if (html_url) res += `[*github*](${html_url})`
        if (html_url && homepage) res += ' / '
        if (homepage) res += `[*web*](${homepage})`
        res += ')'

        return res
      },
      github: ({ full_name, stargazers_url, commits_url }) => {
        let res = ''

        res +=
          `[![GitHub stars]` +
          `(https://img.shields.io/github/stars/${full_name}?style=social)]` +
          `('${stargazers_url}')`

        res +=
          `[![GitHub issues]` +
          `(https://img.shields.io/github/issues/${full_name}?style=social)]` +
          `('${commits_url}')`

        res +=
          `[![GitHub PRs]` +
          `(https://img.shields.io/github/issues-pr/${full_name}?style=social)]` +
          `('${commits_url}')`

        res +=
          `[![GitHub commits]` +
          `(https://img.shields.io/github/commit-activity/m/${full_name}?style=social)]` +
          `('${commits_url}')`

        return res
      },
      npm: ({ npm_name }) => {
        let res = ''

        res +=
          `[![NPM downloads]` +
          `(https://img.shields.io/npm/dw/${npm_name}.svg)]` +
          `('https://www.npmjs.com/${npm_name}')`

        res +=
          `[![NPM version]` +
          `(https://img.shields.io/npm/v/${npm_name}.svg)]` +
          `('https://www.npmjs.com/${npm_name}')`

        res +=
          `[![NPM Dependents]` +
          `(https://img.shields.io/librariesio/dependents/npm/${npm_name})]` +
          `('https://www.npmjs.com/${npm_name}')`

        res +=
          `[![NPM Repos]` +
          `(https://img.shields.io/librariesio/dependent-repos/npm/${npm_name})]` +
          `('https://www.npmjs.com/${npm_name}')`

        return res
      },
      sample: ({ sample_name }) =>
        sample_name ? `[SAMPLES/${sample_name}](./samples/${sample_name})` : '*TODO*',
      description: ({ description }) => '*' + description + '*',
    },
    data,
  )

  const preface = await fs.readFile(abs(README_PREFACE_PATH), 'utf8')
  const postface = await fs.readFile(abs(README_POSTFACE_PATH), 'utf8')

  const readme = preface + '\n\n' + table + '\n\n' + postface

  await fs.writeFile(abs('README.md'), readme)
}

main()
