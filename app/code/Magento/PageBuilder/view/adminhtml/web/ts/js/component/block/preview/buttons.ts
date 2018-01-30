/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import ko from "knockout";
import PreviewBlock from "./block";
import Block from "../block";

export default class Buttons extends PreviewBlock {
    constructor(parent: Block, config: object) {
        super(parent, config);
    }
}
