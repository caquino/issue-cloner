 Clone issue to another repository

Clone an issue to a predefined repository when labeled with a specific label

## Inputs

### `token`

**Required** Github token with repo:all permissions.

### `targetRepo`

**Required** The repository in which to clone the issue.

### `sourceLabel`

**Optional** The label on which to react. Default `clone`.

### `destinationLabel`
**Optional** The label to be assigned to the cloned issue. Default is ``.

## Example usage

```yml
uses: caquino/issue-cloner@v0.8
with:
  sourceLabel: "to_clone"
  destinationLabel: "cloned"
  targetRepo: myorg/myrepo
  token: ${{ secrets.CLONE_ISSUE_TOKEN }}
```
