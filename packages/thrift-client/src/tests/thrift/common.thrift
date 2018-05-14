/**
 * Thrift files can namespace, package, or prefix their output in various
 * target languages.
 */
namespace cpp common
namespace d common
namespace dart common
namespace java common
namespace php common
namespace perl common
namespace haxe common
namespace netcore common

exception AuthException {
  1: i32 code
  2: string message
}

struct Metadata {
    1: required i32 traceId
    2: optional i32 clientId
}
