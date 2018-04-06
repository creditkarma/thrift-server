/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

# Thrift Tutorial
# Mark Slee (mcslee@facebook.com)
#
# This file aims to teach you how to use Thrift, in a .thrift file. Neato. The
# first thing to notice is that .thrift files support standard shell comments.
# This lets you make your thrift file executable and include your Thrift build
# step on the top line. And you can place comments like this anywhere you like.
#
# Before running this file, you will need to have installed the thrift compiler
# into /usr/local/bin.

/**
 * The first thing to know about are types. The available types in Thrift are:
 *
 *  bool        Boolean, one byte
 *  i8 (byte)   Signed 8-bit integer
 *  i16         Signed 16-bit integer
 *  i32         Signed 32-bit integer
 *  i64         Signed 64-bit integer
 *  double      64-bit floating point value
 *  string      String
 *  binary      Blob (byte array)
 *  map<t1,t2>  Map from one type to another
 *  list<t1>    Ordered list of one type
 *  set<t1>     Set of unique elements of one type
 *
 * Did you also notice that Thrift supports C style comments?
 */

include "shared.thrift"
include "common.thrift"
include "operation.thrift"

namespace cpp calculator
namespace d calculator
namespace dart calculator
namespace java calculator
namespace php calculator
namespace perl calculator
namespace haxe calculator
namespace netcore calculator

typedef i32 MyInteger
typedef operation.Operation Operation
typedef common.CommonStruct CommonStruct

const i32 INT32CONSTANT = 9853
const map<string,string> MAPCONSTANT = {'hello':'world', 'goodnight':'moon'}

struct Work {
  1: required i32 num1 = 0,
  2: required i32 num2,
  3: required Operation op,
  4: optional string comment,
}

struct FirstName {
  1: string name
}

struct LastName {
  1: string name
}

union Choice {
  1: FirstName firstName
  2: LastName lastName
}

service Calculator extends shared.SharedService {

   void ping(),

   i32 add(1: i32 num1, 2: i32 num2) throws (1: operation.JankyResult exp),

   i64 addInt64(1: i64 num1, 2: i64 num2),

   i32 addWithContext(1: i32 num1, 2: i32 num2),

   i32 calculate(1:i32 logid, 2:Work work) throws (1: operation.JankyOperation ouch),

   string echoBinary(1: binary word)

   string echoString(1: string word)

   string checkName(1: Choice choice),

   string checkOptional(1: optional string type),

   list<i32> mapOneList(1: list<i32> arg)

   list<i32> mapValues(1: map<string,i32> arg)

   map<string,string> listToMap(1: list<list<string>> arg)

   common.CommonStruct fetchThing()

   /**
    * This method has a oneway modifier. That means the client only makes
    * a request and does not listen for any response at all. Oneway methods
    * must be void.
    */
   oneway void zip()

}

/**
 * That just about covers the basics. Take a look in the test/ folder for more
 * detailed examples. After you run this file, your generated code shows up
 * in folders with names gen-<language>. The generated code isn't too scary
 * to look at. It even has pretty indentation.
 */
