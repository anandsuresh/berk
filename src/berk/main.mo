import Text "mo:base/Text";

actor Repository {
    // State
    stable var HEAD : Text = "ref: refs/heads/master";

    // Methods
    public query func getHead(): async Text {
        HEAD
    };
};
