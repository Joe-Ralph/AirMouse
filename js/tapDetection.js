//Constants
var SENSOR_DESIRED_INTERVAL = 10; // Sensor data rate in milliseconds
var DOUBLE_TAP_THRESHOLD = 500; // Maximum time difference for double tap (in milliseconds)
var THRESHOLD_FACTOR = 0.5;
var sensorAccelerometer = null;
var prevLowPass = 0;
var prevHighPass = 0;
//var textbox = document.querySelector('#textbox');

// Sensor event handler
function onSensorDataChange(data) {
//  var timestamp = data.timestamp;
  var timestamp = Date.now();
  var x = data.x;
  var y = data.y;
  var z = data.z;
//  
//  console.log('Acc',{ x: x, y: y, z: z, timestamp: timestamp });

  processAccelerometerData({ x: x, y: y, z: z, timestamp: timestamp });
//  processAccelerometerData({ x: 0, y: 0, z: 0, timestamp: timestamp });
}

// Tap detection and classification
function processAccelerometerData(data) {
  var timestamp = data.timestamp;
  var x = data.x;
  var y = data.y;
  var z = data.z;

  // Preprocessing
  var magnitude = Math.sqrt(x * x + y * y + z * z);

  // Filtering
  var lowPassCoeff = 0.05;
  var highPassCoeff = 0.95;

  var lowPass = prevLowPass + lowPassCoeff * (magnitude - prevLowPass);
  var highPass = highPassCoeff * (prevHighPass + lowPass - prevLowPass);

  // Pan-Tompkins algorithm with real-time processing
  var squared = (highPass - prevHighPass) * (highPass - prevHighPass);
//  var integrated = 0; // Reset integration for each new data point

  var panTompkinsThreshold = THRESHOLD_FACTOR * Math.max(squared, prevLowPass); // Update threshold based on current and previous low-pass value
  console.log(""+data.x+","+data.y+","+data.z);
  console.log({lowpass: lowPass, highpass: highPass, squared: squared, panTompkinsThreshold: panTompkinsThreshold});
  if (squared >= panTompkinsThreshold) {
    // Potential tap peak detected
    var lastTap = window.taps ? window.taps[window.taps.length - 1] : null;

    if (lastTap && timestamp - lastTap.timestamp <= DOUBLE_TAP_THRESHOLD) {
      // Double tap detected
      console.log('Double tap detected at:', timestamp);
//      textbox.innerText = 'Double';
      window.doubleTaps.push([lastTap, { timestamp: timestamp }]); // Store both taps in doubleTaps array
      window.taps = []; // Clear taps for next detection cycle
    } else {
      // Single tap detected
      console.log('Single tap detected at:', timestamp);
//      textbox.innerText = 'single';
      window.taps = [{ timestamp: timestamp }]; // Store single tap for potential double tap comparison
    }
  }

  prevLowPass = lowPass;
  prevHighPass = highPass;
}

// Start sensor data listener{
function startSensorListener() { 
	var capability = tizen.systeminfo.getCapability('http://tizen.org/feature/sensor.accelerometer');
	if (capability === true) {
	    /* Device supports the proximity sensor */
		console.log('Sensor available');
		sensorAccelerometer = tizen.sensorservice.getDefaultSensor('ACCELERATION');
	}
	
	sensorAccelerometer.setChangeListener(onSensorDataChange, SENSOR_DESIRED_INTERVAL, 2000);
	sensorAccelerometer.start(onsuccessCB);
}

function onsuccessCB()
{
  console.log("Acceleration sensor start");
}



// Start the sensor listener
startSensorListener();

window.taps = []; // Initialize empty taps array to store potential single taps
window.doubleTaps = []; // Initialize empty array to store detected double taps
