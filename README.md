# http-echo-server

## Test

### Verbose testing with coverage collection

```
lerna run --stream --scope @ptm/buffer-writable-stream test -- -- --verbose --collect-coverage
```

### Regular testing with coverage collection

```
lerna run --stream --scope @ptm/buffer-writable-stream test -- -- --collect-coverage
```

### Regular testing

```
lerna run --stream --scope @ptm/buffer-writable-stream test
```