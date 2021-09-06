const minValue = 11;
const maxValue = 91;
const minSecondValue = 3;
const maxSecondValue = 55;
const minThirdValue = 35;
const maxThirdValue = 77;

export default {
  // Alan: investigar al poner un async enfrente de () lo conviert en promesa ???
  creacion: () => {
    let firstNumbers = Math.floor(Math.random() * (maxValue - minValue)) + minValue;
    let secondNumbers = Math.floor(Math.random() * (maxValue - minValue)) + minValue;
    let thirdNumbers = Math.floor(Math.random() * (maxThirdValue - minThirdValue));

    return '' + firstNumbers + '' + secondNumbers + '' + thirdNumbers;

  }
}
