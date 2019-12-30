'use strict';
/**
 * Kado - High Quality JavaScript Libraries based on ES6+ <https://kado.org>
 * Copyright © 2013-2020 Bryan Tong, NULLIVEX LLC. All rights reserved.
 *
 * This file is part of Kado.
 *
 * Kado is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kado is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kado.  If not, see <https://www.gnu.org/licenses/>.
 */


describe('Format',()=> {
  const { expect } = require('../lib/Validate')
  const Format = require('../lib/Format')
  //all static no constructor needed
  it('should Format.toFixedFix(1.236,2) === 1.24',()=>{
    expect.eq(Format.toFixedFix(1.236,2),1.24)
  })
  it('should Format.toFixedFix(1.234,2) === 1.23',()=>{
    expect.eq(Format.toFixedFix(1.234,2),1.23)
  })
  it('should Format.toFixedFix(1.234) === 1',()=>{
    expect.eq(Format.toFixedFix(1.234),1)
  })

  it('should Format.number(1234.5604) === \'1,235\'',()=>{
    expect.eq(Format.number(1234.5604),'1,235')
  })
 it('should Format.number(1234.5604,2) === \'1,234.56\'',()=>{
    expect.eq(Format.number(1234.5604,2),'1,234.56')
  })
 it('should Format.number(1234.5604,3) === \'1,234.560\'',()=>{
    expect.eq(Format.number(1234.5604,3),'1,234.560')
  })
 it('should Format.number(1234.5605,3) === \'1,234.561\'',()=>{
    expect.eq(Format.number(1234.5605,3),'1,234.561')
  })

  it('should Format.bytes(1000P) === \'1,000PB\'',()=>{
    expect.eq(Format.bytes(1000000000000000000),'1,000PB')
  })
  it('should Format.bytes(1000T) === \'1,000TB\'',()=>{
    expect.eq(Format.bytes(1000000000000000),'1,000TB')
  })
  it('should Format.bytes(1000G) === \'1,000GB\'',()=>{
    expect.eq(Format.bytes(1000000000000),'1,000GB')
  })
  it('should Format.bytes(1000M) === \'1,000MB\'',()=>{
    expect.eq(Format.bytes(1000000000),'1,000MB')
  })
  it('should Format.bytes(1000K) === \'1,000KB\'',()=>{
    expect.eq(Format.bytes(1000000),'1,000KB')
  })
  it('should Format.bytes(1000) === \'1,000B\'',()=>{
    expect.eq(Format.bytes(1000),'1,000B')
  })
  it('should Format.bytes(999,{force:\'k\'}) === \'1KB\'',()=>{
    expect.eq(Format.bytes(999,{force:'k'}),'1KB')
  })
  it('should Format.bytes(999,{force:\'k\',suffix:\'bit\'}) === \'1Kbit\'',()=>{
    expect.eq(Format.bytes(999,{force:'k',suffix:'bit'}),'1Kbit')
  })

  it('should Format.inetPtoN(\'1.2.3.4\') === \'\\u0001\\u0002\\u0003\\u0004\'',()=>{
    expect.eq(Format.inetPtoN('1.2.3.4'),'\u0001\u0002\u0003\u0004')
  })
  it('should Format.inetPtoN(\'1:2:3::4\') === \'\\u0000\\u0001\\u0000\\u0002\\u0000\\u0003\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0004\'',()=>{
    expect.eq(Format.inetPtoN('1:2:3::4'),'\u0000\u0001\u0000\u0002\u0000\u0003\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0004')
  })
  it('should Format.inetPtoN(\'::1\') === \'\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0001\'',()=>{
    expect.eq(Format.inetPtoN('::1'),'\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0001')
  })

  it('should Format.ip(\'1.2.3.4\') === \'001.002.003.004\'',()=>{
    expect.eq(Format.ip('1.2.3.4'),'001.002.003.004')
  })
  it('should Format.ip(\'1.2.3.4\',\' \') === \'  1.  2.  3.  4\'',()=>{
    expect.eq(Format.ip('1.2.3.4',' '),'  1.  2.  3.  4')
  })
  it('should Format.ip(\'1.2.3.4\',\' \',true) === \'&nbsp;&nbsp;1.&nbsp;&nbsp;2.&nbsp;&nbsp;3.&nbsp;&nbsp;4\'',()=>{
    expect.eq(Format.ip('1.2.3.4',' ',true),'&nbsp;&nbsp;1.&nbsp;&nbsp;2.&nbsp;&nbsp;3.&nbsp;&nbsp;4')
  })
  it('should Format.ip(\'1.2.3.4\',\'\') === \'1.2.3.4\'',()=>{
    expect.eq(Format.ip('1.2.3.4',''),'1.2.3.4')
  })
  it('should Format.ip(\'1:2:3::4\') === \'0001:0002:0003:0000:0000:0000:0000:0004\'',()=>{
    expect.eq(Format.ip('1:2:3::4'),'0001:0002:0003:0000:0000:0000:0000:0004')
  })
  it('should Format.ip(\'1:2:3::4\',\' \') === \'   1:   2:   3:   0:   0:   0:   0:   4\'',()=>{
    expect.eq(Format.ip('1:2:3::4',' '),'   1:   2:   3:   0:   0:   0:   0:   4')
  })
  it('should Format.ip(\'1:2:3::4\',\'\') === \'1:2:3:0:0:0:0:4\'',()=>{
    expect.eq(Format.ip('1:2:3::4',''),'1:2:3:0:0:0:0:4')
  })
})
