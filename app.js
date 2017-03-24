var app = new Vue({
    el: '#app',
    data: {
        channelList: [],
        channelsValue: '',
        processedValue: '',
        apkFile: null,
        packing: false,
        packingChannel: '',
        pendingChannelJob: []
    },
    methods: {
        handleFile: function(f) {
            console.time("load zip")
            JSZip.loadAsync(f).then(this.zipInstanceReady, function(e) {
                console.error("Error reading " + f.name + " : " + e.message);
            });
        },
        zipInstanceReady: function(zip) {
            this.zip = zip;
            console.timeEnd("load zip");
        },
        onFileChange: function(evt) {
            this.apkFile = evt.target.files[0];
            var name = this.apkFile.name.toLowerCase();
            this.name = this.apkFile.name.substr(0, name.lastIndexOf(".apk"));
            this.sufix = this.apkFile.name.substr(this.name.length);
            this.handleFile(this.apkFile);
        },
        onChannlesChange: function() {
            if (this.channelsValue == this.processedValue) {
                return;
            }
            this.channelList = this.channelsValue.trim().split('\n').map(function(s) {
                return s.trim();
            }).filter(function(s) {
                return s;
            });
            this.processedValue = this.channelsValue;
        },
        addPackJob: function(channel) {
            this.pendingChannelJob.push(channel);
            if (!this.packing) {
                this.startPack();
            }
        },
        startPack: function() {
            if (this.pendingChannelJob.length > 0) {
                this.packing = true;
                this.packChannelApk(this.pendingChannelJob.shift());
            } else {
                this.packing = false;
                this.packingChannel = '';
            }
        },
        packBlobReady: function(blob) {
            console.timeEnd("generate " + this.packingChannel);
            saveAs(blob, this.getFileNameByChannel(this.packingChannel));
            this.startPack();
        },
        packChannelApk: function(channel) {
            if (!this.zip) {
                console.error("zip not ready!");
                return;
            }
            this.packingChannel = channel;
            this.zip.file("META-INF/channel", channel);
            console.time("generate " + channel);
            this.zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                },
            }, this.updatePackProgress).then(this.packBlobReady);
        },
        updatePackProgress: function(status) {
            console.log(status.percent);
        },
        getFileNameByChannel: function(channel) {
            return this.name + '-' + channel + this.sufix;
        },
        packNow: function(channel) {
            if (this.packing) {
                return;
            }
            if (typeof channel == 'string') {
                this.pendingChannelJob.push(channel);
            } else if (this.channelList.length > 0) {
                this.pendingChannelJob = this.pendingChannelJob.concat(this.channelList);
            }
            this.startPack();
        }
    }
});
