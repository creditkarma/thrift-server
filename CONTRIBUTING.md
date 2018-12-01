Thank you for considering contributing to Thrift Server!
Please take a moment to review this document to make the contribution process easy and effective.

## Reporting a bug

Thrift Server uses github issues to track bugs. Bugs are labelled as [bug](https://github.com/creditkarma/thrift-server/labels/bug).
Before reporting a new bug first search the issues to find out if it's already reported and/or resolved and pending merge.

When you create a new bug report please include following information:

* Short description
* Environment on which you are able to reproduce it
* Steps to reproduce

## Feature requests

Feature requests are labelled as [enhancement](https://github.com/creditkarma/thrift-server/labels/enhancement).
We welcome new feature requests but first find out if a similar request is already in the queue.

## Pull requests (bug fix, features, etc)

We welcome community contribution and help improving Thrift Server. Please keep your PRs focused to the scope.

All PRs will be reviewed by a core team who maintains Thrift Server project.
The core team will decide a PR should be merged to master and released as a patch, minor or major version.

### Testing your PR

Because there are many interdependencies within the `thrift-server` repo there is a `thrift-integration` package for testing integrations between packages to avoid circular dependencies. Once you have completed your work in a given package it may be necessary to add a test to `thrift-integration`.
