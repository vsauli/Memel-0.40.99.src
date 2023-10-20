// Fast Fourier Transform calculation

//#pragma sequential
//#pragma parvar inputData
////#pragma parvar output



/**
 * Returns the radix-2 fast fourier transform of the given array.
 * Optionally computes the radix-2 inverse fast fourier transform.
 *
 * @param {ComplexNumber[]} inputData
 * @param {boolean} [inverse]
 * @return {ComplexNumber[]}
 */

var OPUS = 4;  // Must be power of 2

set_prototypes();

var inputData = [
      new ComplexNumber({ re: -83656.9359385182, im: 98724.08038374918 }),
      new ComplexNumber({ re: -47537.415125808424, im: 88441.58381765135 }),
      new ComplexNumber({ re: -24849.657029355192, im: -72621.79007878687 }),
      new ComplexNumber({ re: 31451.27290052717, im: -21113.301128347346 }),
      new ComplexNumber({ re: 13973.90836288876, im: -73378.36721594246 }),
      new ComplexNumber({ re: 14981.520420492234, im: 63279.524958963884 }),
      new ComplexNumber({ re: -9892.575367044381, im: -81748.44671677813 }),
      new ComplexNumber({ re: -35933.00356823792, im: -46153.47157161784 }),
      new ComplexNumber({ re: -22425.008561855735, im: -86284.24507370662 }),
      new ComplexNumber({ re: -39327.43830818355, im: 30611.949874562706 }),
    ];

  for (var i = 1; i < 10000; i++) {
   for (var j = 0; j < 10; j++) {
	inputData.push(inputData[j]);
	}
	}

  var inverse = false;
  var output = [];
  var bitsCount = bitLength(inputData.length - 1);
  var N = 1 << bitsCount;

  while (inputData.length < N) {
    inputData.push(new ComplexNumber());
  }
  for (var dataSampleIndex = 0; dataSampleIndex < N; dataSampleIndex += 1) {
    output[dataSampleIndex] = inputData[reverseBits(dataSampleIndex, bitsCount)];
    }

  //#pragma wait
  //#pragma cache inputData
  //#pragma noautoparvar
  //#pragma parallel
  for (var i=1; i<8; i++) {
      inputData = inputData;
      console.log("Cached OPU #"+i);
  }
  //#pragma wait
  //#pragma parvar output
  //#pragma sequential
  var start_time = new Date().getTime();
  var finish_time;
  var elapse_time;
//  console.log("Program started");
//  var output = [];
//  __set_Par_Var_Value('output', output, __job, true);
//      console.log(output.length);

  var blockLength = 2;
  //#pragma dive
  //#pragma wait
  //#pragma parvar output
  while ( blockLength <= N ) {
    var imaginarySign = inverse ? -1 : 1;
    var phaseStep = {};
    var Math = global.Math;
    phaseStep.re = Math.cos(2 * Math.PI / blockLength);
    phaseStep.im = imaginarySign * Math.sin(2 * Math.PI / blockLength);

    var nopu = Math.floor(N / blockLength);
    if (nopu > OPUS) nopu = OPUS;
//    console.log('nopu='+nopu);
    console.log('blockLength='+blockLength);
    //#pragma parallel
    //#pragma wait
    //#pragma noautoparvar
    //#pragma parvar output
    //#pragma parvar outputblock
    for (var opu = 1; opu <= nopu; opu++) {
      set_prototypes();
      phaseStep = phaseStep;
      output = __get_Par_Var_Value('output', true, __job); 
console.log('after get');
      var outputblock = [];
      var chunk_len = Math.floor(N / nopu);
      var slice_start = (opu-1) * chunk_len;
      var slice_end = slice_start + chunk_len - 1;
      if (slice_end >= N) slice_end = N - 1;
      for (var blockStart = slice_start; blockStart <= slice_end; blockStart += blockLength) {
        var phase = new ComplexNumber({ re: 1, im: 0 });

        for (var signalId = blockStart; signalId < (blockStart + blockLength / 2); signalId += 1) {
          var component = new ComplexNumber(output[signalId + blockLength / 2]).multiply(phase);

          var upd1 = new ComplexNumber(output[signalId]).add(component);
          var upd2 = new ComplexNumber(output[signalId]).subtract(component);

          outputblock[signalId-slice_start] = upd1;
          outputblock[signalId + blockLength / 2 - slice_start] = upd2;

          phase = phase.multiply(new ComplexNumber(phaseStep));
        }
      }
    __set_Par_Var_Value('output', outputblock, __job, false, slice_start);
  console.log('after set');
  }
  //#pragma sequential
  //#pragma wait
  blockLength *= 2;
  }
  var output = __get_Par_Var_Value('output', false, __job);   
  if (inverse) {
    for (var signalId = 0; signalId < N; signalId += 1) {
      output[signalId] /= N;
    }
  }

  console.log(output.length);
//for (var j = 0; j < output.length; j++)
//  console.log(output[j].re + ":::" + output[j].im);

  finish_time = new Date().getTime();
  elapse_time = (finish_time - start_time) / 1000;
  console.log("Elapse time: " + elapse_time + " sec\n");


function ComplexNumber(number) {
  /**
   * z = re + im * i
   * z = radius * e^(i * phase)
   *
   * @param {number} [re]
   * @param {number} [im]
   */
    if (!number) {
	this.re = 0;
	this.im = 0;
	}
    else {
	this.re = number.re;
	this.im = number.im;
	}
}

function set_prototypes() {

ComplexNumber.prototype.add = function(addend) {

  /**
   * @param {ComplexNumber|number} addend
   * @return {ComplexNumber}
   */

    // Make sure we're dealing with complex number.
    var complexAddend = this.toComplexNumber(addend);

    return new ComplexNumber({
      re: this.re + complexAddend.re,
      im: this.im + complexAddend.im,
    });
};

ComplexNumber.prototype.subtract = function(subtrahend) {

  /**
   * @param {ComplexNumber|number} subtrahend
   * @return {ComplexNumber}
   */
   
    // Make sure we're dealing with complex number.
    var complexSubtrahend = this.toComplexNumber(subtrahend);

    return new ComplexNumber({
      re: this.re - complexSubtrahend.re,
      im: this.im - complexSubtrahend.im,
    });
};

ComplexNumber.prototype.multiply = function(multiplicand) {
  /**
   * @param {ComplexNumber|number} multiplicand
   * @return {ComplexNumber}
   */

    // Make sure we're dealing with complex number.
    var complexMultiplicand = this.toComplexNumber(multiplicand);

    return new ComplexNumber({
      re: this.re * complexMultiplicand.re - this.im * complexMultiplicand.im,
      im: this.re * complexMultiplicand.im + this.im * complexMultiplicand.re,
    });
};

ComplexNumber.prototype.divide = function(divider) {

  /**
   * @param {ComplexNumber|number} divider
   * @return {ComplexNumber}
   */

    // Make sure we're dealing with complex number.
    var complexDivider = this.toComplexNumber(divider);

    // Get divider conjugate.
    var dividerConjugate = this.conjugate(complexDivider);

    // Multiply dividend by divider's conjugate.
    var finalDivident = this.multiply(dividerConjugate);

    // Calculating final divider using formula (a + bi)(a − bi) = a^2 + b^2
    var finalDivider = (complexDivider.re * complexDivider.re) + (complexDivider.im * complexDivider.im);

    return new ComplexNumber({
      re: finalDivident.re / finalDivider,
      im: finalDivident.im / finalDivider,
    });
};

ComplexNumber.prototype.conjugate = function(number) {

  /**
   * @param {ComplexNumber|number} number
   */

    // Make sure we're dealing with complex number.
    var complexNumber = this.toComplexNumber(number);

    return new ComplexNumber({
      re: complexNumber.re,
      im: -1 * complexNumber.im,
    });
};

ComplexNumber.prototype.getRadius = function() {
  /**
   * @return {number}
   */

    return Math.sqrt((this.re * this.re) + (this.im * this.im));
};

ComplexNumber.prototype.getPhase = function(inRadians) {
  /**
   * @param {boolean} [inRadians]
   * @return {number}
   */

    if (inRadians == undefined) inRadians = true;

    var phase = Math.atan(Math.abs(this.im) / Math.abs(this.re));

    if (this.re < 0 && this.im > 0) {
      phase = Math.PI - phase;
    } else if (this.re < 0 && this.im < 0) {
      phase = -(Math.PI - phase);
    } else if (this.re > 0 && this.im < 0) {
      phase = -phase;
    } else if (this.re === 0 && this.im > 0) {
      phase = Math.PI / 2;
    } else if (this.re === 0 && this.im < 0) {
      phase = -Math.PI / 2;
    } else if (this.re < 0 && this.im === 0) {
      phase = Math.PI;
    } else if (this.re > 0 && this.im === 0) {
      phase = 0;
    } else if (this.re === 0 && this.im === 0) {
      // More correctly would be to set 'indeterminate'.
      // But just for simplicity reasons let's set zero.
      phase = 0;
    }

    if (!inRadians) {
      phase = radianToDegree(phase);
    }

    return phase;
};

ComplexNumber.prototype.getPolarForm = function(inRadians) {
  /**
   * @param {boolean} [inRadians]
   * @return {{radius: number, phase: number}}
   */
    if (inRadians == undefined) inRadians = true;

    return {
      radius: this.getRadius(),
      phase: this.getPhase(inRadians),
    };
};

ComplexNumber.prototype.toComplexNumber = function(number) {

  /**
   * Convert real numbers to complex number.
   * In case if complex number is provided then lefts it as is.
   *
   * @param {ComplexNumber|number} number
   * @return {ComplexNumber}
   */

    if (number instanceof ComplexNumber) {
      return number;
    }

    return new ComplexNumber({ re: number });
};


}

/**
 * Return the number of bits used in the binary representation of the number.
 *
 * @param {number} number
 * @return {number}
 */
function bitLength(number) {
  var bitsCounter = 0;

  while ((1 << bitsCounter) <= number) {
    bitsCounter += 1;
  }

  return bitsCounter;
}

/**
 * Returns the number which is the flipped binary representation of input.
 *
 * @param {number} input
 * @param {number} bitsCount
 * @return {number}
 */
function reverseBits(input, bitsCount) {
  var reversedBits = 0;

  for (var bitIndex = 0; bitIndex < bitsCount; bitIndex += 1) {
    reversedBits *= 2;

    if (Math.floor(input / (1 << bitIndex)) % 2 === 1) {
      reversedBits += 1;
    }
  }

  return reversedBits;
}

/**
 * @param {number} radian
 * @return {number}
 */
function radianToDegree(radian) {
  return radian * (180 / Math.PI);
}
