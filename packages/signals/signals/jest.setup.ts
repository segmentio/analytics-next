/* eslint-disable no-undef */
import './src/test-helpers/jest-extended'
import { JestSerializers } from '@internal/test-helpers'
import 'fake-indexeddb/auto'
globalThis.structuredClone = (v: any) => JSON.parse(JSON.stringify(v))
expect.addSnapshotSerializer(JestSerializers.jestSnapshotSerializerTimestamp)
