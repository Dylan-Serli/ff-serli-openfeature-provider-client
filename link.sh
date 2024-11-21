#!/usr/bin/env bash
echo "cleaning.."
npm run clean

echo "building.."
npm run build

echo "linking.."
sudo npm unlink ff-serli-openfeature-provider-client
sudo npm link
