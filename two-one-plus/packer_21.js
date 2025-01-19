// const to_pack =
//   process.argv[2] ?? 'for(A=10;A<100;++A)console.log(123+456%A%21)';
// const verbose = !process.argv.includes('--quiet');

function possible_best_regexes(to_pack) {
  /*
	Build a set of regexes to check:
	(A) uD.
	(B) u\D*
	(C) uD*X? for some X in 8-B
	(D) uD+X? for some X in 8-B
	(E) uD[XY] for some X in 8-B, Y in C-F
	
	If (A) works, then no need to include (E), since (A) matches everything (E) does.
	If (C) works, then no need to include (D), since (C) matches everything (D) does.
	*/

  const ret = [];

  //Checks if a regex will prevent packing non-ASCII in the source
  function test_regex(regex) {
    for (const c of to_pack) {
      const escaped = escape(c);
      if (c != escaped && regex.test(escaped)) return false;
    }
    return true;
  }

  //Add regex (A) or (E)
  const A_regex = /uD./g;
  if (test_regex(A_regex)) {
    ret.push(A_regex);
  } else {
    outer_loop: for (let first = 8; first < 12; ++first) {
      for (let second = 12; second < 16; ++second) {
        const reg = new RegExp(
          `uD[${first.toString(16).toUpperCase()}${second
            .toString(16)
            .toUpperCase()}]`,
          'g'
        );
        if (test_regex(reg)) {
          ret.push(reg);
          break outer_loop;
        }
      }
    }
  }

  //Add regex (B)
  const B_regex = /u\D*/g;
  if (test_regex(B_regex)) {
    ret.push(B_regex);
  }

  //Add regex (C) and (D)
  for (let first = 8; first < 12; ++first) {
    const reg = new RegExp(`uD*${first.toString(16).toUpperCase()}?`, 'g');
    if (test_regex(reg)) {
      ret.push(reg);
    } else {
      const reg2 = new RegExp(`uD+${first.toString(16).toUpperCase()}?`, 'g');
      if (test_regex(reg2)) {
        ret.push(reg2);
      }
    }
  }

  if (!ret.length)
    console.error(
      "Can't find a RegExp compatible with Unicode characters in the source. Try escaping the Unicode characters."
    );

  return ret;
}

function count_chars(s) {
  if (s === undefined) return Infinity;
  return [...s].length;
}

function do_pack(to_pack, regex) {
  /*
	Build table of what every Unicode character would unpack to. 
	As a performance optimization, do the surrogate pairs individually, prune any that can't be part of the solution, and then recombine them.
	*/
  const char_map = new Map();
  let max_length = 1; //max length that 1 char unpacks to
  for (let j = 0; j < 65536; ++j) {
    //Skip Unicode surrogates
    if (0xd800 <= j && j <= 0xdfff) continue;

    let c = String.fromCodePoint(j);
    const q = unescape(escape(c).replace(regex, ''));

    //Check if the char needs escaping
    let char_cost = 1;
    if ([13, 92, 96].includes(j)) {
      char_cost = 2;
      if (j == 13) c = `\\r`;
      if (j == 92) c = `\\\\`;
      if (j == 96) c = '\\`';
    }

    if (!char_map.has(q) || char_map.get(q)[1] > char_cost)
      char_map.set(q, [c, char_cost]);
    max_length = Math.max(max_length, q.length);
  }

  const high_surrogate_unpack = new Map();
  const low_surrogate_unpack = new Map();

  for (let i = 0; i < 1024; ++i) {
    const unpack1 = unescape(
      ('%u' + (0xd800 + i).toString(16).toUpperCase()).replace(regex, '')
    );
    if (to_pack.includes(unpack1)) high_surrogate_unpack.set(i, unpack1);

    const unpack2 = unescape(
      ('%u' + (0xdc00 + i).toString(16).toUpperCase()).replace(regex, '')
    );
    if (to_pack.includes(unpack2)) low_surrogate_unpack.set(i, unpack2);
  }

  for (const [i_high, high_unpack] of high_surrogate_unpack) {
    for (const [i_low, low_unpack] of low_surrogate_unpack) {
      const q = high_unpack + low_unpack;
      if (!char_map.has(q) || char_map.get(q)[1] > 1)
        char_map.set(q, [
          String.fromCodePoint(65536 + i_high * 1024 + i_low),
          1,
        ]);
      max_length = Math.max(max_length, q.length);
    }
  }

  //Using dynamic programming to find shortest packing
  let state = [{ str: '', cost: 0 }];
  for (const i in to_pack) {
    if (state[0] !== undefined) {
      for (let l = 1; l <= max_length; l++) {
        const target = to_pack.slice(i, +i + l);
        const k = char_map.get(target);
        if (k !== undefined) {
          const str1 = state[0].str + k[0];
          const cost1 = state[0].cost + k[1];
          if (cost1 < (state[l]?.cost ?? Infinity))
            state[l] = { str: str1, cost: cost1 };
        }
      }
    }
    state.shift();
  }

  return {
    length: (state[0]?.cost ?? Infinity) + regex.toString().length + 37,
    packed_string: state[0]?.str,
    packed_program:
      'eval(unescape(escape`' + state[0]?.str + '`.replace(' + regex + ',``)))',
    regex: regex,
  };
}

function display_pack(pack) {
  if (pack.length === Infinity) {
    console.log('Regex', pack.regex, 'failed to pack');
    return;
  }
  console.log('Regex', pack.regex, 'length =', pack.length);

  let source = '';
  let division = '';
  const evaled_string = eval('`' + pack.packed_string + '`');
  for (const c of evaled_string) {
    let decoded = unescape(escape(c).replace(pack.regex, ``))
      .replace(/[\x00-\x20]/gu, ' ')
      .replace(/[^\x20-\x7E]/gu, '?');
    source += decoded;
    if (decoded.length) division += '|' + '-'.repeat(decoded.length - 1);
  }
  const max_line_length = 50;
  for (let i = 0; i < source.length; i += max_line_length) {
    console.log(source.slice(i, i + max_line_length));
    console.log(division.slice(i, i + max_line_length));
  }
}

function run_tests() {
  const tests = [
    [60, "console.log('헬로, 월드!')"],
    [58, "console.log('Hello, 😀')"],
    [57, "console.log('Hello, World!')"],
    [58, "console.log('Hello, World!!')"],
    [56, 'A%1234+B%456+3456789E101+C%7890'],
    [56, 'A%1234+B%456+3456789E101+C%7890'],
    [52, '~A%15%14%13%12%11%10%9'],
    [49, unescape('%uD800%uDC00%uD900%uDD00%uDA00%uDE00')],
    [49, unescape('%uD800%uDC00%uD900%uDD00%uDB00%uDF00')],
    [60, '·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A·1A'],
    [
      64,
      unescape(
        '%u85000%0%u95000%0%uA5000%0%uB5000%0%uC5000%0%D5000%0%E5000%0%F5000%0'
      ),
    ],
    [54, unescape('%B000%C000%E000%F000%8000%9000%B000%C000%E000')],
    [49, '\\😀'],
    [56, '5%A+-6%B+-7%C+-8%D+-9%E+-0%F'],
    [49, 'XY%1%2%3%4%5%6%7%8'],
    [Infinity, unescape('%uD800%uDC00%uD900%uDD00%uDA00%uDE00%uDB00%uDF00')],
  ];

  const all_regexes = [/uD./g, /u\D*/g];
  for (let first = 8; first < 12; ++first) {
    all_regexes.push(
      new RegExp(`uD*${first.toString(16).toUpperCase()}?`, 'g')
    );
    all_regexes.push(
      new RegExp(`uD+${first.toString(16).toUpperCase()}?`, 'g')
    );
    for (let second = 12; second < 16; ++second)
      all_regexes.push(
        new RegExp(
          `uD[${first.toString(16).toUpperCase()}${second
            .toString(16)
            .toUpperCase()}]`,
          'g'
        )
      );
  }

  let okay = true;
  for (const [expected_length, to_pack] of tests) {
    const pack_results_all = all_regexes.map((r) => do_pack(to_pack, r));
    const best_pack = Math.min(...pack_results_all.map((x) => x.length));

    const pack_results_auto = possible_best_regexes(to_pack).map((r) =>
      do_pack(to_pack, r)
    );
    const best_pack_auto = Math.min(...pack_results_auto.map((x) => x.length));

    if (best_pack_auto !== best_pack || best_pack !== expected_length) {
      console.log(
        'Failed test: auto =',
        best_pack_auto,
        'best =',
        best_pack,
        'expected =',
        expected_length
      );
      display_pack(pack_results_all.find((x) => x.length == best_pack));
      display_pack(pack_results_auto.find((x) => x.length == best_pack_auto));
      okay = false;
    }
  }
  if (okay) console.log('All tests passed');
}

function twoOnePlus(to_pack, verbose) {
  let best_pack = { length: Infinity };
  const regexes = possible_best_regexes(to_pack);

  for (const regex_to_test of regexes) {
    const pack_results = do_pack(to_pack, regex_to_test);
    if (verbose) display_pack(pack_results);
    if (pack_results.length < best_pack.length) best_pack = pack_results;
  }

  if (best_pack.length < Infinity) {
    if (verbose) console.log('Best result:', best_pack.length);
    console.log(best_pack.packed_program);
    return best_pack.packed_program;
  } else {
    console.error('Failed to pack');
    // process && (process.exitCode = 1);
  }
}

// if (true) main(to_pack, verbose);
// else run_tests();
