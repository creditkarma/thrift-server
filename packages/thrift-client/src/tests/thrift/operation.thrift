/**
 * Thrift files can namespace, package, or prefix their output in various
 * target languages.
 */
namespace java operation
namespace js operation

/**
 * You can define enums, which are just 32 bit integers. Values are optional
 * and start at 1 if not supplied, C style again.
 */
enum Operation {
  ADD = 1,
  SUBTRACT = 2,
  MULTIPLY = 3,
  DIVIDE = 4
}
