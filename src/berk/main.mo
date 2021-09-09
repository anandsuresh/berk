import Bool "mo:base/Bool";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";


actor Repository {
    ///////////
    // State //
    ///////////

    let eq: (Text, Text)->Bool  = func(x, y) { x == y };
    let keyHash: (Text)->Hash.Hash = func(x)   { Text.hash x };

    var HEAD : Text = "ref: refs/heads/master";
    var refs : HashMap.HashMap<Text, Text> = HashMap.HashMap(1024, eq, keyHash);
    var objects : HashMap.HashMap<Text, Blob> = HashMap.HashMap(1024, eq, keyHash);


    /////////////////////
    // Methods (Query) //
    /////////////////////

    public query func getHead(): async Text {
        Debug.print ("GET /HEAD: " # HEAD);
        HEAD
    };

    public query func getInfoPacks(): async Text {
        Debug.print ("GET /objects/info/packs");
        "\n"
    };

    public query func getObject(id: Text): async ?Blob {
        let obj = objects.get(id);
        switch obj {
          case null { Debug.print ("GET /objects/" # id # " => null"); };
          case (?x) { Debug.print (debug_show (("GET /objects/" # id # " => ", x.size(), " bytes"))); };
        };
        obj
    };

    public query func getRefs(): async Text {
        Debug.print ("GET /info/refs");

        var result: Text = "";
        for ((ref, hash) in refs.entries()) {
          result #= hash # "\t" # ref # "\n";
        };
        result
    };


    //////////////////////
    // Methods (Update) //
    //////////////////////

    public func lock(path: Text): async Bool {
        true
    };

    public func unlock(path: Text): async Bool {
        true
    };

    public func putObject(id: Text, blob: Blob): async () {
        Debug.print (debug_show (("PUT /objects/" # id # " => ", blob.size(), " bytes")));
        objects.put(id, blob);
    };

    public func moveObject(src: Text, dst: Text): async () {
        Debug.print ("MOVE /objects/" # src # " => " # dst);
        let blob = objects.remove(src);
        switch (blob) {
          case (?x) { objects.put(dst, x); };
          case null {};
        }
    };

    public func putRef(name: Text, value: Text): async () {
        Debug.print ("PUT " # name # " => " # value);
        refs.put(name, value)
    }
};
