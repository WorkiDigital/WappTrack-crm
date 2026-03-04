
// Main handlers file - now imports from separate modules
export { processClientMessage, processComercialMessage } from './messageProcessors.ts';
export { handlePendingLeadConversion } from './pendingLeadHandler.ts';
export { handleDirectLead } from './directLeadHandler.ts';
export { getUtmsFromDirectClick } from './utmHandler.ts';
export { getDeviceDataByPhone } from './deviceDataHandler.ts';
