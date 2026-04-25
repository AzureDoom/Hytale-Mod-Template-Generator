const LICENSE_TEXT = {
    MIT: `MIT License

Copyright (c) {{year}} {{author}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
    'Apache-2.0': `Apache License
Version 2.0, January 2004

Copyright {{year}} {{author}}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    'BSD-2-Clause': `BSD 2-Clause License

Copyright (c) {{year}}, {{author}}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED.`,
    'BSD-3-Clause': `BSD 3-Clause License

Copyright (c) {{year}}, {{author}}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS".`,
    'GPL-2.0-only': `GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

Copyright (C) {{year}} {{author}}

This project is licensed under the GNU General Public License v2.0 only.
See https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html for the full text.`,
    'GPL-3.0-only': `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) {{year}} {{author}}

This project is licensed under the GNU General Public License v3.0 only.
See https://www.gnu.org/licenses/gpl-3.0.en.html for the full text.`,
    'LGPL-2.1-only': `GNU LESSER GENERAL PUBLIC LICENSE
Version 2.1, February 1999

Copyright (C) {{year}} {{author}}

This project is licensed under the GNU Lesser General Public License v2.1 only.
See https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html for the full text.`,
    'LGPL-3.0-only': `GNU LESSER GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) {{year}} {{author}}

This project is licensed under the GNU Lesser General Public License v3.0 only.
See https://www.gnu.org/licenses/lgpl-3.0.en.html for the full text.`,
    'AGPL-3.0-only': `GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007

Copyright (C) {{year}} {{author}}

This project is licensed under the GNU Affero General Public License v3.0 only.
See https://www.gnu.org/licenses/agpl-3.0.en.html for the full text.`,
    'MPL-2.0': `Mozilla Public License Version 2.0

Copyright (c) {{year}} {{author}}

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`,
    'EPL-2.0': `Eclipse Public License - v 2.0

Copyright (c) {{year}} {{author}}

This program and the accompanying materials are made available under the
terms of the Eclipse Public License 2.0 which is available at
https://www.eclipse.org/legal/epl-2.0/.`,
    ISC: `ISC License

Copyright (c) {{year}}, {{author}}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES.`,
    'CC0-1.0': `CC0 1.0 Universal

To the extent possible under law, {{author}} has waived all copyright and
related or neighboring rights to this work.

See https://creativecommons.org/publicdomain/zero/1.0/ for the full text.`,
    Unlicense: `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose.

For more information, please refer to https://unlicense.org/`,
    'EUPL-1.2': `European Union Public Licence v. 1.2

Copyright (c) {{year}} {{author}}

Licensed under the EUPL, Version 1.2 or subsequent versions as soon as they
are approved by the European Commission.
See https://eupl.eu/ for the full text.`,
    Proprietary: `All Rights Reserved

Copyright (c) {{year}} {{author}}

All rights reserved. No part of this software may be reproduced, distributed,
or transmitted in any form or by any means without the prior written
permission of the copyright holder.`
};
export function buildLicense(spdx, author) {
    const template = LICENSE_TEXT[spdx];
    const year = new Date().getFullYear().toString();
    return template ? template.replace(/\{\{author\}\}/g, author).replace(/\{\{year\}\}/g, year) : '';
}
