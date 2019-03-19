import { exec } from 'child_process'
import { promisify } from 'util'
import { v4 } from 'uuid'
import { Mqtt } from 'azure-iot-device-mqtt'
import { Client, Message } from 'azure-iot-device'
import chalk from 'chalk'
let { green, red, yellow, blue, magenta } = chalk

let hubName = 'openhack-4-teamhub'
let deviceId = 'marks-laptop'
let frequency = 1000

async function main() {
	let deviceList = await execJson(`az iot hub device-identity list --hub-name ${hubName}`)
	let device = deviceList.find((device: any) => device.deviceId === deviceId)
	if (!device) {
		device = await execJson(`az iot hub device-identity create --hub-name ${hubName} --device-id ${deviceId}`)
		console.log(`${green('✔')} Created device '${magenta(deviceId)}' on hub '${magenta(hubName)}'`)
	} else {
		console.log(`${yellow('⚠')} Skipped creating device '${magenta(deviceId)}' since it already exists`)
	}
	let { connectionString } = await execJson(`az iot hub device-identity show-connection-string --hub-name ${hubName} --device-id ${deviceId}`)
	let client = Client.fromConnectionString(connectionString, Mqtt)
	await client.open()
	console.log(`${green('✔')} Connected device '${magenta(deviceId)}' to hub '${magenta(hubName)}'`)
	while (true) {
		let event = { ticketId: v4(), entryTime: Math.floor(Date.now() / 1000) }
		let message = new Message(JSON.stringify(event))
		await client.sendEvent(message)
		console.log(`${green('✔')} Sent ticket '${blue(event.ticketId)}' at '${yellow(event.entryTime.toString())}'`)
		await sleep(frequency)
	}
}

async function execJson(cmd: string) {
	let result = await promisify(exec)(cmd)
	return JSON.parse(result.stdout)
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => {
	console.error(red('✖') + err.message)
	process.exit(1)
})
