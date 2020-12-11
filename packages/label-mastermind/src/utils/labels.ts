import { GitHub } from '@actions/github'
import { loggingData } from '@videndum/utilities'
import { log } from '..'
import { api, Repo } from '../api'
import { Labels, Runners } from '../types'
import { formatColor } from './parsingData'

/**
 * Syncronise labels to repository
 * @author IvanFon, TGTGamer, jbinda
 * @since 1.0.0
 */
export async function sync({
  client,
  config,
  repo,
  dryRun
}: {
  client: GitHub
  config: Runners['labels']
  repo: Repo
  dryRun: boolean
}) {
  /**
   * Syncronises the repo labels
   * !todo Add delete labels
   * @since 2.0.0
   */
  if (!config) throw new Error('Cannot syncronise labels without config')
  const curLabels: Labels = await api.labels
    .get({ client, repo })
    .catch(err => {
      throw log(
        new loggingData('500', `Error thrown while getting labels: ` + err)
      )
    })
  log(new loggingData('100', `curLabels: ${JSON.stringify(curLabels)}`))
  for (const configLabel of Object.values(config)) {
    const label = curLabels[configLabel.name.toLowerCase()]

    /**
     * Update label
     * @author IvanFon, TGTGamer, jbinda
     * @since 1.0.0
     */
    if (label) {
      if (
        (label.description !== configLabel.description &&
          configLabel.description !== undefined) ||
        label.color !== formatColor(configLabel.color)
      ) {
        log(
          new loggingData(
            '200',
            `Recreate ${JSON.stringify(configLabel)} (prev: ${JSON.stringify(
              label
            )})`
          )
        )
        await api.labels
          .update({ client, repo, label: configLabel, dryRun })
          .catch(err => {
            log(
              new loggingData(
                '500',
                `Error thrown while updating label: ` + err
              )
            )
          })
      } else {
        log(
          new loggingData(
            '200',
            `No action required to update label: ${label.name}`
          )
        )
      }

      /**
       * Create label
       * @author IvanFon, TGTGamer, jbinda
       * @since 1.0.0
       */
    } else {
      log(new loggingData('200', `Create ${JSON.stringify(configLabel)}`))
      await api.labels
        .create({ client, repo, label: configLabel, dryRun })
        .catch(err => {
          log(
            new loggingData('500', `Error thrown while creating label: ` + err)
          )
        })
    }
  }

  for (const curLabel of Object.values(curLabels)) {
    const label = config[curLabel.name.toLowerCase()]
    if (!label) {
      log(new loggingData('400', `Delete ${JSON.stringify(curLabel)}`))
      await api.labels
        .del({ client, repo, name: curLabel.name, dryRun })
        .catch(err => {
          log(
            new loggingData('500', `Error thrown while deleting label: ` + err)
          )
        })
    }
  }
}

/**
 * Add or Remove Labels
 * @author IvanFon, TGTGamer, jbinda
 * @since 1.0.0
 */
export async function addRemove({
  client,
  curLabels,
  labelID,
  labelName,
  IDNumber,
  hasLabel,
  repo,
  shouldHaveLabel,
  dryRun
}: {
  client: GitHub
  curLabels: Labels | undefined
  labelID: string
  labelName: string
  IDNumber: number
  hasLabel: boolean
  repo: Repo
  shouldHaveLabel: boolean
  dryRun: boolean
}) {
  if (!curLabels || !labelName)
    return log(
      new loggingData(
        '200',
        `Can't run add or remove labels if you don't provide ${
          !curLabels
            ? `the current labels ${curLabels}`
            : `the name of the label you want to apply: ${labelName}`
        }`
      )
    )
  log(
    new loggingData(
      '100',
      `Current label: ${labelName.toLowerCase()} -- Does issue have label: ${Boolean(
        hasLabel
      )} but should it: ${shouldHaveLabel}`
    )
  )
  if (shouldHaveLabel && !hasLabel) {
    log(new loggingData('200', `Adding label "${labelID}"...`))
    await api.labels
      .add({ client, repo, IDNumber, label: labelName, dryRun })
      .catch(err => {
        log(new loggingData('500', `Error thrown while adding labels: ` + err))
      })
  } else if (!shouldHaveLabel && hasLabel) {
    log(new loggingData('200', `Removing label "${labelID}"...`))
    await api.labels
      .remove({
        client,
        repo,
        IDNumber,
        label: labelName,
        dryRun
      })
      .catch(err => {
        log(
          new loggingData('500', `Error thrown while removing labels: ` + err)
        )
      })
  } else {
    log(
      new loggingData(
        '200',
        `No action required for label "${labelID}"${
          hasLabel ? ' as label is already applied.' : '.'
        }`
      )
    )
  }
}