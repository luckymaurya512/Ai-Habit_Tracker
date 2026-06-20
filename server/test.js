import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dns.resolveSrv(
    "_mongodb._tcp.aihabittracker.3ixznvs.mongodb.net",
    (err, records) => {
        console.log("ERR:", err);
        console.log("RECORDS:", records);
    }
);