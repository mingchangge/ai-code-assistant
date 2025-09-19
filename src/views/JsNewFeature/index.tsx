import configData1 from './config-data.json' with { type: 'json' }

const configData2 = await import('./config-data.json', {
  assert: { type: 'json' }
})

function JsNewFeature() {
  //   const arr = [1, 2, 3, 4, 5]
  //   assert.ok(arr.at(-1) === 5)
  return (
    <div>
      <h1>JavaScript 新特性</h1>
      <pre>{JSON.stringify(configData1, null, 2)}</pre>
      <pre>{JSON.stringify(configData2.default, null, 2)}</pre>
    </div>
  )
}

export default JsNewFeature
