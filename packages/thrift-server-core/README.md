# Thrift Server Core

Base package for the other Thrift libraries. This will usually not be used directly.

## Int64

For representing 64-bit integers in JavaScript we use the [node-int64 library](https://github.com/broofa/node-int64). We extend the base class from the library with static methods for working with 64-bit integers written as strings. These functions are largely taken from the apache thrift libs and added as static methods for convinience.

### `fromDecimalString`

Given a string of decimal digits, return a `Int64` object instance.

```typescript
import { Int64 } from '@creditkarma/thrift-server-core'

const i64: Int64 = Int64.fromDecimalString("89374875")
```

### `toDecimalString`

```typescript
import { Int64 } from '@creditkarma/thrift-server-core'

const i64: Int64 = Int64.fromDecimalString("89374875")
const val: string = i64.toDecimalString()

// val === "89374875"
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)