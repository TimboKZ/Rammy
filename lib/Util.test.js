/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2018
 * @license GPL-3.0
 */

const {describe, it} = require('mocha');
const assert = require('chai').assert;

const Util = require('./Util');

describe('Util', () => {

    describe('#isComponentName()', () => {
        it('should accept valid alphanumeric component names', () => {
            assert.isTrue(Util.isComponentName('My_Module/some-long-template-name'));
            assert.isTrue(Util.isComponentName('template-name-on-its-own'));
            assert.isTrue(Util.isComponentName('snippet-name-on-its-own_123456789'));
        });
        it('should reject invalid component names', () => {
            assert.isFalse(Util.isComponentName('Too/Many/Slashes'));
            assert.isFalse(Util.isComponentName('Inv@lid$ymbols'));
            assert.isFalse(Util.isComponentName('S p a c e s'));
            assert.isFalse(Util.isComponentName('Другие языки'));
        });
    });

});
