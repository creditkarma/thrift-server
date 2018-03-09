/**
 * Thrift files can namespace, package, or prefix their output in various
 * target languages.
 */
namespace cpp calculator
namespace d calculator
namespace dart calculator
namespace java calculator
namespace php calculator
namespace perl calculator
namespace haxe calculator
namespace netcore calculator

/**
 * Ahh, now onto the cool part, defining a service. Services just need a name
 * and can optionally inherit from another service using the extends keyword.
 */
service AddService {

   void ping(),

   i32 add(1: i32 num1, 2: i32 num2),

   i64 addInt64(1: i64 num1, 2: i64 num2),

}
