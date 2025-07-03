function Event(name)
{
    this.name = name;
    this.callbacks = new Map();
    this.uuids = new Map();
};

Event.prototype.registerCallback = function (callback, device, uuid)
{
    this.callbacks.set(callback, device);
    this.uuids.set(uuid, callback);
};

function Reactor()
{
    this.events = {};
};

Reactor.prototype.registerEvent = function (eventName)
{
    if (this.events[eventName] === undefined)
        this.events[eventName] = new Event(eventName);
};

Reactor.prototype.dispatchEvent = function (eventName, eventArgs)
{
    if (this.events[eventName])
    {
        for (const [callback, device] of this.events[eventName].callbacks)
        {
            callback(device, eventArgs);
        }
    }
};

Reactor.prototype.addEventListener = function (eventName, callback, device, uuid)
{
    if (this.events[eventName] === undefined)
        this.registerEvent(eventName);
    else
        this.removeEventListener(eventName, uuid);

    // Now register the callback and UUID
    this.events[eventName].registerCallback(callback, device, uuid);
};

Reactor.prototype.removeEventListener = function (eventName, uuid)
{
    if (this.events[eventName] && this.events[eventName].uuids.has(uuid))
    {
        const callback = this.events[eventName].uuids.get(uuid);
        this.events[eventName].callbacks.delete(callback);
        this.events[eventName].uuids.delete(uuid);
    }
};

export default new Reactor();