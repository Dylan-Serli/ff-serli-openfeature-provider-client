#!/usr/bin/env bash
echo "cleaning.."
npm run clean

echo "building.."
npm run build

echo "linking.."
# I need sudo on my mac but it should not be necessary
sudo npm unlink ff-serli-openfeature-provider-client
sudo npm link
