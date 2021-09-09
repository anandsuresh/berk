# `berk`

`berk` is an endeavor to identify what it would take to enable a vanilla `git` cli tool to treat an IC canister as a remote repository. Instead of using the `http_request` query call in the canister, `berk` uses an HTTP proxy (written in node.js) to communicate with the Internet Computer, performing the necessary translation of incoming HTTP requests from the *dumb HTTP client* in `git`. This reason for this approach is to account for certain WebDAV methods that are currently not supported by the Internet Computer HTTP interface.

The hope is that there is sufficient functionality presented in this hackathon project/demo to warrant a more detailed exploration of the enhancements to be made to the Internet Computer to enable a future endeavor to build a clone of GitHub or GitLab on the Internet Computer.


## Getting Started

```bash
# Start the replica
dfx start --background --clean

# Deploys your canisters to the replica and generates your candid interface
dfx deploy

# Start the proxy server
npm start
```


## Demo

For the demo, we will create and initialize a fresh git repository, add some files and commit them into the repository, add the `berk` canister as a remote target, and push the commits up.

To start, open a new terminal window and run the following:

```
# ensure we use the DUMB HTTP client
export GIT_SMART_HTTP=0

# create a fresh directory for the demo
mkdir /tmp/demo
cd /tmp/demo

# create a git repository and initialize it
git init source
cd source

# add some stuff
touch hello.txt
git add hello.txt
git commit --message "added hello.txt"

# update some stuff
echo "hello world" > hello.txt
git add hello.txt
git commit --message "updated hello.txt"

# add the canister as a remote target
git remote add origin http://localhost:8080
git remote -v

# push the commits
git push --set-upstream origin master
```

Once that is done, we will re-clone the repository from the `berk` canister to a new local location and validate that it was correctly cloned.

```
cd /tmp/demo
git clone http://localhost:8080 destination
cd destination
git log

# add a new commit and push it up
echo "bar" > foo.txt
git add foo.txt
git commit --message "added foo.txt"
git push
```

Lastly, return to the source repository, and pull in the changes to verify it works.

```
# return to the source repository
cd ../source
git pull
```


## Known issues

- Ensure to use `GIT_SMART_HTTP=0` when running any commands that involve pushing or pulling data from the canister. Failing this, the proxy server will exit.

- Due to the use of the older *dumb http client* in `git`, an post-update hook that runs `git update-server-info` is not being executed in this demo. As a result, any `git push` results in an ugly error message, BUT does not affect the working of the demo.

```
$ GIT_SMART_HTTP=0 git push --set-upstream origin master

Fetching remote heads...
  fetch 0000000000000000000000000000000000000000 for
Unable to fetch 0000000000000000000000000000000000000000, will not be able to update server info refs
updating 'refs/heads/master'
  from 0000000000000000000000000000000000000000
  to   f950e016fa1ce0e590d2cff03d4dc9e11805ca89
    sending 6 objects
    done
Unable to update server info
To http://localhost:8080
 * [new branch]      master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

- Tested with multiple branches, but not extensively. YMMV.
