import * as fs from 'node:fs'
import * as path from 'node:path'
import { PublishExecutorSchema } from './schema'
import { ExecutorContext } from '@nrwl/devkit'
import { readPackageJson } from '../../utils'
import { PackageJson } from '../../types'

type PackageData = {
    dev: PackageJson
    build: PackageJson
}

function typesNameForDependency(name: string): string {
    if (name.startsWith('@')) {
        name = name.substring(1)
        const [head, tail, ...rest] = name.split('/')
        if (rest.length > 0) {
            throw new Error()
        }

        return `@types/${head}__${tail}`
    } else {
        return `@types/${name}`
    }
}

function fileExists(path: fs.PathLike): boolean {
    try {
        return fs.statSync(path).isFile()
    } catch {
        return false
    }
}

export default async function runExecutor(
    options: PublishExecutorSchema,
    context: ExecutorContext,
) {
    const pathToRootPackageJson = path.resolve(
        context.root,
        // options.projectRoot,
        'package.json',
    )
    console.log({ pathToRootPackageJson })

    const rootPackageJson = readPackageJson(pathToRootPackageJson)
    const rootDependencies = rootPackageJson.dependencies ?? {}

    console.log({ rootDependencies })

    const packages: ReadonlyArray<string> = fs.readdirSync(
        path.resolve(process.cwd(), './packages'),
    )
    const packageData: Array<PackageData> = []
    for (const packageName of packages) {
        const packageJsonDevPath = path.resolve(
            context.root,
            'packages/',
            packageName,
            'package.json',
        )

        const dev = readPackageJson(packageJsonDevPath)

        const packageJsonBuildPath = path.resolve(
            context.root,
            'dist/packages/',
            packageName,
            'package.json',
        )

        if (
            dev.publishConfig?.access === 'public' &&
            fileExists(packageJsonBuildPath)
        ) {
            const build = readPackageJson(packageJsonBuildPath)

            console.log({ build })

            for (const dep in build.dependencies ?? {}) {
                const typesName = typesNameForDependency(dep)
                console.log({ dep, typesName })

                if (rootDependencies[typesName]) {
                    build.dependencies[typesName] = rootDependencies[typesName]
                }
            }

            console.log({ build })
        }
    }

    console.log(process.cwd())
    console.log('Executor ran for Publish', options)
    return {
        success: true,
    }
}
